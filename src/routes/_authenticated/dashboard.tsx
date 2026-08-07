import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Gamepad2, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlatformBadge, hours, relative } from "@/components/platform";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";
import { RequireLinks } from "@/components/require-links";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TriStat Tracker" },
      { name: "description", content: "Your linked-platform overview: playtime, games tracked and active goals." },
      { property: "og:title", content: "Dashboard — TriStat Tracker" },
      { property: "og:description", content: "Your combined Steam + Epic gaming overview." },
    ],
  }),
  component: DashboardPage,
});

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Clock; label: string; value: string; hint?: string }) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DashboardPage() {
  const { data } = useWorkspace();
  const games = data?.games ?? [];
  const goals = data?.goals ?? [];
  const kids = data?.profile?.kids_mode ?? false;

  const totalMinutes = games.reduce((s, g) => s + g.playtime_minutes, 0);
  const steamMinutes = games.filter((g) => g.platform === "steam").reduce((s, g) => s + g.playtime_minutes, 0);
  const epicMinutes = totalMinutes - steamMinutes;
  const achievements = games.reduce((s, g) => s + g.achievements_unlocked, 0);
  const activeGoals = goals.filter((g) => g.status === "active");
  const top = games.slice(0, 8);
  const steamShare = totalMinutes ? Math.round((steamMinutes / totalMinutes) * 100) : 0;

  return (
    <AppShell title={kids ? "Kids Dashboard" : "Dashboard"} subtitle="Overview of imported account data">
      <RequireLinks>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Clock} label="Total playtime" value={hours(totalMinutes)} hint={`${hours(steamMinutes)} Steam · ${hours(epicMinutes)} Epic`} />
          <Stat icon={Gamepad2} label="Games tracked" value={String(games.length)} hint={`${games.filter((g) => g.platform === "steam").length} Steam · ${games.filter((g) => g.platform === "epic").length} Epic`} />
          <Stat icon={Trophy} label="Achievements" value={String(achievements)} hint="Unlocked across both platforms" />
          <Stat icon={Target} label="Active goals" value={String(activeGoals.length)} hint={`${goals.length - activeGoals.length} completed`} />
        </div>

        <div className="surface mt-4 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Platform split</span>
            <span className="text-muted-foreground">{steamShare}% Steam · {100 - steamShare}% Epic</span>
          </div>
          <Progress value={steamShare} className="mt-3" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="surface p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold">Top games</h2>
            <ul className="mt-4 space-y-3">
              {top.map((g) => {
                const pct = top[0]?.playtime_minutes ? Math.round((g.playtime_minutes / top[0].playtime_minutes) * 100) : 0;
                return (
                  <li key={g.id} className="rounded-lg border border-border/70 bg-secondary/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{g.name}</span>
                        <PlatformBadge platform={g.platform} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {hours(g.playtime_minutes)} · {g.achievements_unlocked}/{g.achievements_total} 🏆 · {relative(g.last_played_at)}
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2 h-1.5" />
                  </li>
                );
              })}
              {!top.length ? <li className="text-sm text-muted-foreground">No games synced yet — hit Sync above.</li> : null}
            </ul>
          </section>

          <section className="surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Goals</h2>
              <Button asChild size="sm" variant="ghost">
                <Link to="/goals">Manage</Link>
              </Button>
            </div>
            <ul className="mt-4 space-y-4">
              {activeGoals.slice(0, 5).map((goal) => {
                const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
                return (
                  <li key={goal.id}>
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{goal.title}</span>
                      <span className="text-muted-foreground">{goal.current_value}/{goal.target_value}</span>
                    </div>
                    <Progress value={pct} className="mt-2 h-1.5" />
                  </li>
                );
              })}
              {!activeGoals.length ? (
                <li className="text-sm text-muted-foreground">No active goals yet.</li>
              ) : null}
            </ul>
          </section>
        </div>
      </RequireLinks>
    </AppShell>
  );
}
