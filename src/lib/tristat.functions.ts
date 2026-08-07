import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  rebuildActivity,
  recomputeGoals,
  resolveEpicAccount,
  resolveSteamAccount,
  syncPlatform,
} from "./tristat.server";

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const uid = context.userId;
    const [profile, links, games, friends, goals, activity, goalEvents] = await Promise.all([
      db.from("profiles").select("*").eq("id", uid).maybeSingle(),
      db.from("linked_accounts").select("*").eq("user_id", uid),
      db.from("games").select("*").eq("user_id", uid).order("playtime_minutes", { ascending: false }),
      db.from("friends").select("*").eq("user_id", uid).order("name"),
      db.from("goals").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      db
        .from("activity_events")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(60),
      db
        .from("goal_events")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const failures = [
      ["profiles", profile.error],
      ["linked_accounts", links.error],
      ["games", games.error],
      ["friends", friends.error],
      ["goals", goals.error],
      ["activity_events", activity.error],
      ["goal_events", goalEvents.error],
    ].filter(([, error]) => error);

    if (failures.length) {
      throw new Error(
        failures.map(([name, error]) => `${name}: ${(error as { message?: string }).message ?? "unknown error"}`).join(" | "),
      );
    }

    return {
      profile: profile.data,
      links: links.data ?? [],
      games: games.data ?? [],
      friends: friends.data ?? [],
      goals: goals.data ?? [],
      activity: activity.data ?? [],
      goalEvents: goalEvents.data ?? [],
    };
  });

export const linkAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ platform: z.enum(["steam", "epic"]), handle: z.string().min(1).max(120) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const account =
      data.platform === "steam" ? await resolveSteamAccount(data.handle) : resolveEpicAccount(data.handle);

    const { error } = await db.from("linked_accounts").upsert(
      {
        user_id: context.userId,
        platform: data.platform,
        platform_user_id: account.id,
        platform_username: account.username,
        avatar_url: account.avatar,
      },
      { onConflict: "user_id,platform" },
    );
    if (error) throw new Error(error.message);

    await syncPlatform(db, context.userId, data.platform);
    await rebuildActivity(db, context.userId);
    await recomputeGoals(db, context.userId);
    return { ok: true, username: account.username };
  });

export const unlinkAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ platform: z.enum(["steam", "epic"]) }).parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await db.from("games").delete().eq("user_id", context.userId).eq("platform", data.platform);
    await db.from("friends").delete().eq("user_id", context.userId).eq("platform", data.platform);
    await db.from("linked_accounts").delete().eq("user_id", context.userId).eq("platform", data.platform);
    await rebuildActivity(db, context.userId);
    return { ok: true };
  });

export const syncNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    await syncPlatform(db, context.userId, "steam");
    await syncPlatform(db, context.userId, "epic");
    await rebuildActivity(db, context.userId);
    const completed = await recomputeGoals(db, context.userId);
    return { ok: true, completed };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        display_name: z.string().min(1).max(60).optional(),
        visibility: z.enum(["public", "friends", "private"]).optional(),
        hide_playtime: z.boolean().optional(),
        hide_achievements: z.boolean().optional(),
        hide_online_status: z.boolean().optional(),
        hide_activity: z.boolean().optional(),
        kids_mode: z.boolean().optional(),
        hide_friends_list: z.boolean().optional(),
        parental_pin: z.string().regex(/^\d{4}$/).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    const { error } = await context.supabase
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        title: z.string().min(1).max(80),
        goal_type: z.enum(["playtime", "achievement", "game"]),
        platform: z.enum(["steam", "epic"]).nullable().optional(),
        game_name: z.string().max(120).nullable().optional(),
        target_value: z.number().int().positive().max(100000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("goals").insert({
      user_id: context.userId,
      title: data.title,
      goal_type: data.goal_type,
      platform: data.platform ?? null,
      game_name: data.game_name ?? null,
      target_value: data.target_value,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("goal_events").insert({
      user_id: context.userId,
      kind: "created",
      message: `Goal created: ${data.title}`,
    });
    await recomputeGoals(context.supabase, context.userId);
    return { ok: true };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await context.supabase.from("goals").delete().eq("id", data.id).eq("user_id", context.userId);
    return { ok: true };
  });
