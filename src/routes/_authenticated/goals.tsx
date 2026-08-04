import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireLinks } from "@/components/require-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { createGoal, deleteGoal } from "@/lib/tristat.functions";
import { relative } from "@/components/platform";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Goals — TriStat Tracker" },
      { name: "description", content: "Create playtime, achievement and game-specific goals that update from Steam and Epic data." },
      { property: "og:title", content: "Goals — TriStat Tracker" },
      { property: "og:description", content: "Track progress toward your gaming goals automatically." },
    ],
  }),
  component: GoalsPage,
});

function GoalsPage() {
  const { data } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const create = useServerFn(createGoal);
  const remove = useServerFn(deleteGoal);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"playtime" | "achievement" | "game">("playtime");
  const [platform, setPlatform] = useState<"all" | "steam" | "epic">("all");
  const [gameName, setGameName] = useState("");
  const [target, setTarget] = useState("50");
  const [busy, setBusy] = useState(false);

  const goals = data?.goals ?? [];
  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");

  async function submit() {
    if (!title.trim() || Number(target) <= 0) {
      toast.error("Give the goal a title and a positive target.");
      return;
    }
    setBusy(true);
    try {
      await create({
        data: {
          title: title.trim(),
          goal_type: type,
          platform: platform === "all" ? null : platform,
          game_name: type === "game" ? gameName.trim() : null,
          target_value: Number(target),
        },
      });
      await refresh();
      setTitle("");
      setGameName("");
      toast.success("Goal created");
    } catch {
      toast.error("Could not create that goal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Goals" subtitle={`${active.length} active · ${completed.length} completed`}>
      <RequireLinks>
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="surface p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold">Active goals</h2>
            <ul className="mt-4 space-y-4">
              {active.map((g) => {
                const pct = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
                return (
                  <li key={g.id} className="rounded-lg border border-border/70 bg-secondary/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{g.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.goal_type} · {g.platform}
                          {g.game_name ? ` · ${g.game_name}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {g.current_value}/{g.target_value}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            await remove({ data: { id: g.id } });
                            await refresh();
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={pct} className="mt-3 h-2" />
                  </li>
                );
              })}
              {!active.length ? <li className="text-sm text-muted-foreground">No active goals yet.</li> : null}
            </ul>

            <h2 className="mt-8 text-sm font-semibold">Goal history</h2>
            <ul className="mt-3 space-y-2">
              {completed.map((g) => (
                <li key={g.id} className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm">
                  <span>{g.title}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">Completed</Badge>
                    {relative(g.completed_at)}
                  </span>
                </li>
              ))}
              {!completed.length ? <li className="text-sm text-muted-foreground">Nothing completed yet.</li> : null}
            </ul>
          </section>

          <section className="surface h-fit p-5">
            <h2 className="text-sm font-semibold">New goal</h2>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Play 50 hours this season" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="playtime">Playtime (hours)</SelectItem>
                    <SelectItem value="achievement">Achievements</SelectItem>
                    <SelectItem value="game">Game-specific (hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Steam + Epic</SelectItem>
                    <SelectItem value="steam">Steam</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {type === "game" ? (
                <div className="space-y-1.5">
                  <Label>Game</Label>
                  <Select value={gameName} onValueChange={setGameName}>
                    <SelectTrigger><SelectValue placeholder="Pick a game" /></SelectTrigger>
                    <SelectContent>
                      {(data?.games ?? []).map((g) => (
                        <SelectItem key={g.id} value={g.name}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="target">Target</Label>
                <Input id="target" type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
              <Button className="w-full" onClick={submit} disabled={busy}>
                <Plus /> Create goal
              </Button>
            </div>
          </section>
        </div>
      </RequireLinks>
    </AppShell>
  );
}
