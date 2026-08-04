import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { KidsBlocked, RequireLinks } from "@/components/require-links";
import { PlatformBadge, PresenceDot, hours, relative } from "@/components/platform";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/_authenticated/friends/$friendId")({
  head: () => ({
    meta: [
      { title: "Friend profile — TriStat Tracker" },
      { name: "description", content: "Public Steam and Epic stats for a friend, respecting private profiles." },
      { property: "og:title", content: "Friend profile — TriStat Tracker" },
      { property: "og:description", content: "Playtime, achievements and recent activity for your friend." },
    ],
  }),
  component: FriendProfile,
});

function FriendProfile() {
  const { friendId } = useParams({ from: "/_authenticated/friends/$friendId" });
  const { data, isLoading } = useWorkspace();
  const kids = data?.profile?.kids_mode ?? false;
  const friend = data?.friends.find((f) => f.id === friendId);
  const events = (data?.activity ?? []).filter((a) => a.friend_id === friendId);

  return (
    <AppShell title={friend?.name ?? "Friend"} subtitle="Public profile">
      <RequireLinks>
        {kids ? (
          <KidsBlocked feature="Friend profiles" />
        ) : (
          <>
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link to="/friends">
                <ArrowLeft /> Back to friends
              </Link>
            </Button>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !friend ? (
              <div className="surface p-8 text-center text-sm text-muted-foreground">Friend not found.</div>
            ) : friend.is_private ? (
              <div className="surface p-10 text-center">
                <Lock className="mx-auto size-6 text-muted-foreground" />
                <h2 className="mt-3 text-lg font-semibold">This profile is private</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {friend.name} has restricted their {friend.platform === "steam" ? "Steam" : "Epic"} profile.
                </p>
              </div>
            ) : (
              <>
                <div className="surface flex flex-wrap items-center gap-4 p-6">
                  <Avatar className="size-16">
                    <AvatarImage src={friend.avatar_url ?? undefined} alt={friend.name} />
                    <AvatarFallback>{friend.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{friend.name}</h2>
                      <PlatformBadge platform={friend.platform} />
                    </div>
                    <PresenceDot status={friend.status} />
                    <p className="text-xs text-muted-foreground">
                      Last played {friend.last_played_game ?? "—"} · {relative(friend.last_played_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="surface p-5">
                    <p className="text-xs text-muted-foreground uppercase">Playtime</p>
                    <p className="mt-2 text-xl font-semibold">{hours(friend.total_playtime_minutes)}</p>
                  </div>
                  <div className="surface p-5">
                    <p className="text-xs text-muted-foreground uppercase">Games</p>
                    <p className="mt-2 text-xl font-semibold">{friend.games_count}</p>
                  </div>
                  <div className="surface p-5">
                    <p className="text-xs text-muted-foreground uppercase">Achievements</p>
                    <p className="mt-2 text-xl font-semibold">{friend.achievements_count}</p>
                  </div>
                </div>

                <section className="surface mt-4 p-5">
                  <h3 className="text-sm font-semibold">Recent activity</h3>
                  <ul className="mt-3 space-y-3">
                    {events.map((e) => (
                      <li key={e.id} className="text-sm">
                        <span className="font-medium">{e.actor_name}</span>{" "}
                        <span className="text-muted-foreground">{e.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {e.detail} · {relative(e.created_at)}
                        </span>
                      </li>
                    ))}
                    {!events.length ? <li className="text-sm text-muted-foreground">No recent activity.</li> : null}
                  </ul>
                </section>
              </>
            )}
          </>
        )}
      </RequireLinks>
    </AppShell>
  );
}
