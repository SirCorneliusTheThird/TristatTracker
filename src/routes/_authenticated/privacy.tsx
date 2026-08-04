import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { updateProfile } from "@/lib/tristat.functions";

export const Route = createFileRoute("/_authenticated/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — TriStat Tracker" },
      { name: "description", content: "Control profile visibility and hide playtime, achievements, online status or activity." },
      { property: "og:title", content: "Privacy — TriStat Tracker" },
      { property: "og:description", content: "Public, friends-only or private — you decide what is shared." },
    ],
  }),
  component: PrivacyPage,
});

type Toggle = "hide_playtime" | "hide_achievements" | "hide_online_status" | "hide_activity";

const toggles: { key: Toggle; label: string; hint: string }[] = [
  { key: "hide_playtime", label: "Hide playtime", hint: "Total hours stay off your public profile." },
  { key: "hide_achievements", label: "Hide achievements", hint: "Trophy counts are not shared." },
  { key: "hide_online_status", label: "Hide online status", hint: "Nobody sees when you're in-game." },
  { key: "hide_activity", label: "Hide activity feed", hint: "Your sessions stay out of feeds." },
];

function PrivacyPage() {
  const { data } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const save = useServerFn(updateProfile);
  const profile = data?.profile;

  async function patch(payload: Record<string, unknown>) {
    try {
      await save({ data: payload as never });
      await refresh();
      toast.success("Privacy updated");
    } catch {
      toast.error("Could not save that setting.");
    }
  }

  return (
    <AppShell title="Privacy & safety" subtitle="Choose exactly what other players can see">
      <div className="surface max-w-2xl p-6">
        <Label className="text-sm font-semibold">Profile visibility</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Private profiles are hidden from everyone, including linked friends.
        </p>
        <Select
          value={profile?.visibility ?? "public"}
          onValueChange={(v) => patch({ visibility: v })}
        >
          <SelectTrigger className="mt-3 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="friends">Friends only</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>

        <div className="mt-6 space-y-4 border-t border-border pt-6">
          {toggles.map((t) => (
            <div key={t.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.hint}</p>
              </div>
              <Switch
                checked={Boolean(profile?.[t.key])}
                onCheckedChange={(v) => patch({ [t.key]: v })}
              />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
