import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type DB = SupabaseClient<Database>;
export type Platform = "steam" | "epic";

/* ---------------------------------- utils --------------------------------- */

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let s = hash(seed) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

const pick = <T,>(r: () => number, arr: readonly T[]) => arr[Math.floor(r() * arr.length)]!;
const int = (r: () => number, min: number, max: number) => Math.floor(min + r() * (max - min + 1));
const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

/* --------------------------------- catalogs -------------------------------- */

const STEAM_GAMES: readonly (readonly [string, string])[] = [
  ["730", "Counter-Strike 2"],
  ["570", "Dota 2"],
  ["1091500", "Cyberpunk 2077"],
  ["1245620", "ELDEN RING"],
  ["292030", "The Witcher 3: Wild Hunt"],
  ["413150", "Stardew Valley"],
  ["1174180", "Red Dead Redemption 2"],
  ["252490", "Rust"],
  ["1086940", "Baldur's Gate 3"],
  ["271590", "Grand Theft Auto V"],
  ["105600", "Terraria"],
  ["236850", "Europa Universalis IV"],
];

const EPIC_GAMES: readonly (readonly [string, string])[] = [
  ["fn", "Fortnite"],
  ["rl", "Rocket League"],
  ["alan2", "Alan Wake 2"],
  ["gta3d", "Grand Theft Auto: Trilogy"],
  ["control", "Control Ultimate Edition"],
  ["fallguys", "Fall Guys"],
  ["deadisland2", "Dead Island 2"],
  ["hades", "Hades"],
  ["satisfactory", "Satisfactory"],
  ["genshin", "Genshin Impact"],
];

const NAMES = [
  "Nova", "Pixel", "Riftwalker", "Quasar", "Zeph", "Bolt", "Karma", "Vex",
  "Lumen", "Onyx", "Sable", "Comet", "Juno", "Rogue", "Static", "Ember",
  "Drift", "Halcyon", "Mako", "Cinder", "Wraith", "Solace",
];
const SUFFIX = ["_gg", "77", "TV", "_x", "99", "Plays", "HD", ""];

const PRESENCE = ["online", "offline", "in-game", "idle"] as const;

function avatarFor(seed: string) {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
}

function coverFor(platform: Platform, appId: string, name: string) {
  if (platform === "steam") {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
  }
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(name)}`;
}

/* ------------------------------- steam web api ----------------------------- */

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

async function fetchSteamLibrary(steamId: string) {
  const key = process.env["STEAM_API_KEY"];
  if (!key) return null;
  const data = await steamFetch<{
    response?: {
      games?: Array<{ appid: number; name?: string; playtime_forever: number; rtime_last_played?: number }>;
    };
  }>(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`,
  );
  const games = data?.response?.games;
  if (!games?.length) return null;
  return games
    .filter((g) => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 24)
    .map((g) => ({
      app_id: String(g.appid),
      name: g.name ?? `App ${g.appid}`,
      playtime_minutes: g.playtime_forever,
      cover_url: coverFor("steam", String(g.appid), g.name ?? ""),
      last_played_at: g.rtime_last_played ? new Date(g.rtime_last_played * 1000).toISOString() : null,
    }));
}

/* ---------------------------------- sync ----------------------------------- */

function simulateLibrary(platform: Platform, seed: string) {
  const r = rng(`${platform}:lib:${seed}`);
  const catalog = platform === "steam" ? STEAM_GAMES : EPIC_GAMES;
  const count = platform === "steam" ? int(r, 7, 10) : int(r, 4, 7);
  return catalog.slice(0, count).map(([appId, name]) => {
    const total = int(r, 12, 64);
    return {
      app_id: appId,
      name,
      cover_url: coverFor(platform, appId, name),
      playtime_minutes: int(r, 90, 24000),
      achievements_total: total,
      achievements_unlocked: int(r, 0, total),
      last_played_at: ago(int(r, 30, 60 * 24 * 40)),
    };
  });
}

function simulateFriends(platform: Platform, seed: string) {
  const r = rng(`${platform}:friends:${seed}`);
  const catalog = platform === "steam" ? STEAM_GAMES : EPIC_GAMES;
  const count = platform === "steam" ? int(r, 8, 12) : int(r, 5, 8);
  const used = new Set<string>();
  const out = [];
  for (let i = 0; i < count; i++) {
    let name = `${pick(r, NAMES)}${pick(r, SUFFIX)}`;
    while (used.has(name)) name = `${pick(r, NAMES)}${pick(r, SUFFIX)}${int(r, 1, 99)}`;
    used.add(name);
    const status = pick(r, PRESENCE);
    const game = pick(r, catalog)[1];
    out.push({
      platform_friend_id: `${platform}-${hash(name).toString(16)}`,
      name,
      avatar_url: avatarFor(name),
      status,
      current_game: status === "in-game" ? game : null,
      last_played_game: game,
      last_played_at: ago(int(r, 5, 60 * 24 * 21)),
      is_private: r() < 0.18,
      total_playtime_minutes: int(r, 600, 180000),
      games_count: int(r, 4, 180),
      achievements_count: int(r, 5, 900),
    });
  }
  return out;
}

export async function syncPlatform(db: DB, userId: string, platform: Platform) {
  const { data: link } = await db
    .from("linked_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .maybeSingle();
  if (!link) return { platform, synced: false };

  const seed = `${userId}:${link.platform_user_id}`;

  let library = simulateLibrary(platform, seed);
  if (platform === "steam") {
    const live = await fetchSteamLibrary(link.platform_user_id);
    if (live) {
      const r = rng(`ach:${seed}`);
      library = live.map((g) => {
        const total = int(r, 10, 60);
        return {
          ...g,
          achievements_total: total,
          achievements_unlocked: int(r, 0, total),
          last_played_at: g.last_played_at ?? ago(int(r, 60, 60 * 24 * 30)),
        };
      });
    }
  }

  await db.from("games").upsert(
    library.map((g) => ({ ...g, user_id: userId, platform, updated_at: new Date().toISOString() })),
    { onConflict: "user_id,platform,app_id" },
  );

  const friends = simulateFriends(platform, seed);
  await db.from("friends").upsert(
    friends.map((f) => ({ ...f, user_id: userId, platform, synced_at: new Date().toISOString() })),
    { onConflict: "user_id,platform,platform_friend_id" },
  );

  await db
    .from("linked_accounts")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", link.id);

  return { platform, synced: true, games: library.length, friends: friends.length };
}

export async function rebuildActivity(db: DB, userId: string) {
  const { data: friends } = await db
    .from("friends")
    .select("id, name, avatar_url, platform, is_private, last_played_game, last_played_at")
    .eq("user_id", userId);
  if (!friends?.length) return 0;

  await db.from("activity_events").delete().eq("user_id", userId);

  const r = rng(`activity:${userId}:${friends.length}`);
  const rows = friends
    .filter((f) => !f.is_private)
    .flatMap((f) => {
      const events = [];
      const n = int(r, 1, 3);
      for (let i = 0; i < n; i++) {
        const kind = pick(r, ["playtime", "achievement", "new_game"] as const);
        const game = f.last_played_game ?? "an unknown game";
        events.push({
          user_id: userId,
          friend_id: f.id,
          platform: f.platform,
          kind,
          actor_name: f.name,
          actor_avatar: f.avatar_url,
          title:
            kind === "playtime"
              ? `played ${game}`
              : kind === "achievement"
                ? `unlocked an achievement in ${game}`
                : `added ${game} to their library`,
          detail:
            kind === "playtime"
              ? `${int(r, 1, 9)}h ${int(r, 0, 59)}m this week`
              : kind === "achievement"
                ? pick(r, ["Speed Demon", "No Deaths", "Completionist", "First Blood", "Collector"])
                : "New in library",
          game_name: game,
          created_at: ago(int(r, 10, 60 * 24 * 10)),
        });
      }
      return events;
    });

  if (rows.length) await db.from("activity_events").insert(rows);
  return rows.length;
}

/* ---------------------------------- goals ---------------------------------- */

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
