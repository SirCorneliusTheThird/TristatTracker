import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type DB = SupabaseClient<Database>;
export type Platform = "steam" | "epic";

type Presence = Database["public"]["Enums"]["presence"];

type SyncedGame = {
  app_id: string;
  name: string;
  cover_url: string | null;
  playtime_minutes: number;
  achievements_total: number;
  achievements_unlocked: number;
  last_played_at: string | null;
};

type SyncedFriend = {
  platform_friend_id: string;
  name: string;
  avatar_url: string | null;
  status: Presence;
  current_game: string | null;
  last_played_game: string | null;
  last_played_at: string | null;
  is_private: boolean;
  total_playtime_minutes: number;
  games_count: number;
  achievements_count: number;
};

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function avatarFor(seed: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
}

function coverFor(platform: Platform, appId: string, name: string) {
  if (platform === "steam") {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
  }
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(name)}`;
}

async function steamFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function resolveSteamAccount(input: string) {
  const key = process.env["STEAM_API_KEY"];
  const trimmed = input.trim();
  const idMatch = trimmed.match(/(\d{17})/);
  const vanity = trimmed.replace(/\/+$/, "").split("/").pop() ?? trimmed;

  let steamId = idMatch?.[1] ?? null;

  if (key && !steamId && vanity) {
    const resolved = await steamFetch<{ response?: { success?: number; steamid?: string } }>(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(vanity)}`,
    );
    if (resolved?.response?.success === 1 && resolved.response.steamid) {
      steamId = resolved.response.steamid;
    }
  }

  if (key && steamId) {
    const summary = await steamFetch<{
      response?: { players?: Array<{ personaname: string; avatarfull: string; steamid: string }> };
    }>(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId}`);
    const player = summary?.response?.players?.[0];
    if (player) {
      return { id: player.steamid, username: player.personaname, avatar: player.avatarfull, live: true };
    }
  }

  const handle = vanity || "steamplayer";
  return {
    id: steamId ?? String(76561190000000000n + BigInt(hash(handle))),
    username: handle,
    avatar: avatarFor(handle),
    live: false,
  };
}

export function resolveEpicAccount(input: string) {
  const handle = input.trim() || "epicplayer";
  return {
    id: `epic-${hash(handle).toString(16)}`,
    username: handle,
    avatar: avatarFor(`epic-${handle}`),
  };
}

async function fetchSteamLibrary(steamId: string): Promise<SyncedGame[]> {
  const key = process.env["STEAM_API_KEY"];
  if (!key) return [];

  const data = await steamFetch<{
    response?: {
      games?: Array<{ appid: number; name?: string; playtime_forever: number; rtime_last_played?: number }>;
    };
  }>(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`,
  );

  const games = data?.response?.games ?? [];
  return games
    .filter((game) => game.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 24)
    .map((game) => ({
      app_id: String(game.appid),
      name: game.name ?? `App ${game.appid}`,
      cover_url: coverFor("steam", String(game.appid), game.name ?? ""),
      playtime_minutes: game.playtime_forever,
      achievements_total: 0,
      achievements_unlocked: 0,
      last_played_at: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : null,
    }));
}

function mapSteamPresence(player: { personastate?: number; gameextrainfo?: string | null }): Presence {
  if (player.gameextrainfo) return "in-game";
  if (player.personastate === 3 || player.personastate === 4) return "idle";
  if ((player.personastate ?? 0) > 0) return "online";
  return "offline";
}

async function fetchSteamFriends(steamId: string): Promise<SyncedFriend[]> {
  const key = process.env["STEAM_API_KEY"];
  if (!key) return [];

  const list = await steamFetch<{
    friendslist?: { friends?: Array<{ steamid: string }> };
  }>(`https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${key}&steamid=${steamId}&relationship=friend`);

  const ids = list?.friendslist?.friends?.map((friend) => friend.steamid).filter(Boolean) ?? [];
  if (!ids.length) return [];

  const summary = await steamFetch<{
    response?: {
      players?: Array<{
        steamid: string;
        personaname: string;
        avatarfull: string;
        personastate?: number;
        gameextrainfo?: string;
        communityvisibilitystate?: number;
      }>;
    };
  }>(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${ids.join(",")}`);

  return (summary?.response?.players ?? []).map((player) => ({
    platform_friend_id: player.steamid,
    name: player.personaname,
    avatar_url: player.avatarfull,
    status: mapSteamPresence(player),
    current_game: player.gameextrainfo ?? null,
    last_played_game: player.gameextrainfo ?? null,
    last_played_at: null,
    is_private: (player.communityvisibilitystate ?? 1) !== 3,
    total_playtime_minutes: 0,
    games_count: 0,
    achievements_count: 0,
  }));
}

export async function syncPlatform(db: DB, userId: string, platform: Platform) {
  const { data: link } = await db
    .from("linked_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .maybeSingle();
  if (!link) return { platform, synced: false };

  let library: SyncedGame[] = [];
  let friends: SyncedFriend[] = [];

  if (platform === "steam") {
    library = await fetchSteamLibrary(link.platform_user_id);
    friends = await fetchSteamFriends(link.platform_user_id);
  }

  await db.from("games").delete().eq("user_id", userId).eq("platform", platform);
  if (library.length) {
    await db.from("games").upsert(
      library.map((game) => ({ ...game, user_id: userId, platform, updated_at: new Date().toISOString() })),
      { onConflict: "user_id,platform,app_id" },
    );
  }

  await db.from("friends").delete().eq("user_id", userId).eq("platform", platform);
  if (friends.length) {
    await db.from("friends").upsert(
      friends.map((friend) => ({ ...friend, user_id: userId, platform, synced_at: new Date().toISOString() })),
      { onConflict: "user_id,platform,platform_friend_id" },
    );
  }

  await db.from("linked_accounts").update({ last_synced_at: new Date().toISOString() }).eq("id", link.id);

  return { platform, synced: true, games: library.length, friends: friends.length };
}

export async function rebuildActivity(db: DB, userId: string) {
  await db.from("activity_events").delete().eq("user_id", userId);

  const { data: friends } = await db
    .from("friends")
    .select("id, name, avatar_url, platform, is_private, last_played_game, last_played_at")
    .eq("user_id", userId);
  if (!friends?.length) return 0;

  const rows = friends
    .filter((friend) => !friend.is_private && friend.last_played_game && friend.last_played_at)
    .map((friend) => ({
      user_id: userId,
      friend_id: friend.id,
      platform: friend.platform,
      kind: "playtime",
      actor_name: friend.name,
      actor_avatar: friend.avatar_url,
      title: `played ${friend.last_played_game}`,
      detail: null,
      game_name: friend.last_played_game,
      created_at: friend.last_played_at,
    }));

  if (rows.length) await db.from("activity_events").insert(rows);
  return rows.length;
}

export async function recomputeGoals(db: DB, userId: string) {
  const [{ data: goals }, { data: games }] = await Promise.all([
    db.from("goals").select("*").eq("user_id", userId),
    db.from("games").select("*").eq("user_id", userId),
  ]);
  if (!goals?.length) return 0;
  const lib = games ?? [];
  let completed = 0;

  for (const goal of goals) {
    const scoped = goal.platform ? lib.filter((g) => g.platform === goal.platform) : lib;
    let value = 0;
    if (goal.goal_type === "playtime") {
      value = Math.floor(scoped.reduce((s, g) => s + g.playtime_minutes, 0) / 60);
    } else if (goal.goal_type === "achievement") {
      value = scoped.reduce((s, g) => s + g.achievements_unlocked, 0);
    } else {
      const target = scoped.find((g) => g.name === goal.game_name);
      value = target ? Math.floor(target.playtime_minutes / 60) : 0;
    }

    const isDone = value >= goal.target_value;
    if (value === goal.current_value && isDone === (goal.status === "completed")) continue;

    await db
      .from("goals")
      .update({
        current_value: value,
        status: isDone ? "completed" : "active",
        completed_at: isDone ? (goal.completed_at ?? new Date().toISOString()) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal.id);

    if (isDone && goal.status !== "completed") {
      completed++;
      await db.from("goal_events").insert({
        user_id: userId,
        goal_id: goal.id,
        kind: "completed",
        message: `Goal completed: ${goal.title} (${value}/${goal.target_value})`,
      });
    } else if (value > goal.current_value) {
      await db.from("goal_events").insert({
        user_id: userId,
        goal_id: goal.id,
        kind: "progress",
        message: `${goal.title} progressed to ${value}/${goal.target_value}`,
      });
    }
  }
  return completed;
}
