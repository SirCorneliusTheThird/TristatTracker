import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KidsBlocked, RequireLinks } from "@/components/require-links";
import { PlatformBadge, relative } from "@/components/platform";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: "Activity feed — TriStat Tracker" },
      { name: "description", content: "Friends' playtime, achievements and newly added games across Steam and Epic." },
      { property: "og:title", content: "Activity feed — TriStat Tracker" },
      { property: "og:description", content: "Live feed of what your Steam and Epic friends are playing." },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const { data } = useWorkspace();
  const kids = data?.profile?.kids_mode ?? false;
  const hidden = data?.profile?.hide_activity ?? false;
  const events = data?.activity ?? [];

  return (
    <AppShell title="Activity feed" subtitle="What your friends have been up to">
      <RequireLinks>
        {kids ? (
          <KidsBlocked feature="Activity feed" />
        ) : hidden ? (
          <div className="surface p-8 text-center text-sm text-muted-foreground">
            Your activity feed is hidden in privacy settings.
          </div>
        ) : (
          <ol className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="surface flex items-start gap-3 p-4">
                <Avatar className="size-10">
                  <AvatarImage src={e.actor_avatar ?? undefined} alt={e.actor_name} />
                  <AvatarFallback>{e.actor_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{e.actor_name}</span>
                    <PlatformBadge platform={e.platform} />
                    <span className="text-xs text-muted-foreground">{relative(e.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{e.title}</p>
                  {e.detail ? <p className="text-xs text-muted-foreground">{e.detail}</p> : null}
                </div>
              </li>
            ))}
            {!events.length ? (
              <li className="surface p-8 text-center text-sm text-muted-foreground">
                Nothing here yet — sync to pull in friend activity.
              </li>
            ) : null}
          </ol>
        )}
      </RequireLinks>
    </AppShell>
  );
}
