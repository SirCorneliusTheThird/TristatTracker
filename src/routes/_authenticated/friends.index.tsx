import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { KidsBlocked, RequireLinks } from "@/components/require-links";
import { PlatformBadge, PresenceDot, hours, relative } from "@/components/platform";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/_authenticated/friends/")({
  head: () => ({
    meta: [
      { title: "Friends — TriStat Tracker" },
      { name: "description", content: "Auto-imported Steam and Epic friends with online status and last played." },
      { property: "og:title", content: "Friends — TriStat Tracker" },
      { property: "og:description", content: "See who is online across Steam and Epic." },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const { data } = useWorkspace();
  const [q, setQ] = useState("");
  const kids = data?.profile?.kids_mode ?? false;
  const hideFriends = data?.profile?.hide_friends_list ?? false;
  const hideStatus = data?.profile?.hide_online_status ?? false;

  const friends = (data?.friends ?? []).filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
  const online = friends.filter((f) => f.status !== "offline").length;

  return (
    <AppShell title="Friends" subtitle={`${friends.length} imported · ${online} online`}>
      <RequireLinks>
        {kids ? (
          <KidsBlocked feature="Friends" />
        ) : hideFriends ? (
          <div className="surface p-8 text-center text-sm text-muted-foreground">
            Your friends list is hidden by parental controls.{" "}
            <Link to="/privacy" className="text-primary underline">
              Privacy settings
            </Link>
          </div>
        ) : (
          <>
            <Input
              placeholder="Search friends…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-sm"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {friends.map((f) => (
                <Link
                  key={f.id}
                  to="/friends/$friendId"
                  params={{ friendId: f.id }}
                  className="surface flex items-center gap-3 p-4 transition-colors hover:border-primary/50"
                >
                  <Avatar className="size-11">
                    <AvatarImage src={f.avatar_url ?? undefined} alt={f.name} />
                    <AvatarFallback>{f.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{f.name}</span>
                      <PlatformBadge platform={f.platform} />
                      {f.is_private ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          <Lock className="size-3" /> Private
                        </span>
                      ) : null}
                    </div>
                    <PresenceDot status={f.status} hidden={hideStatus} />
                    <p className="truncate text-xs text-muted-foreground">
                      {f.is_private
                        ? "Private profile"
                        : `${f.current_game ?? f.last_played_game ?? "—"} · ${relative(f.last_played_at)} · ${hours(f.total_playtime_minutes)}`}
                    </p>
                  </div>
                </Link>
              ))}
              {!friends.length ? (
                <p className="text-sm text-muted-foreground">No friends found — run a sync to import them.</p>
              ) : null}
            </div>
          </>
        )}
      </RequireLinks>
    </AppShell>
  );
}
