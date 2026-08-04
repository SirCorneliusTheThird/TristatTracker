import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Baby, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { updateProfile } from "@/lib/tristat.functions";

export const Route = createFileRoute("/_authenticated/kids")({
  head: () => ({
    meta: [
      { title: "Kids Mode — TriStat Tracker" },
      { name: "description", content: "Simplified dashboard, no social features, PIN-protected parental controls." },
      { property: "og:title", content: "Kids Mode — TriStat Tracker" },
      { property: "og:description", content: "Family-safe gaming stats with parental controls." },
    ],
  }),
  component: KidsPage,
});

function KidsPage() {
  const { data } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const save = useServerFn(updateProfile);
  const profile = data?.profile;

  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const locked = Boolean(profile?.parental_pin) && !unlocked;

  async function patch(payload: Record<string, unknown>) {
    try {
      await save({ data: payload as never });
      await refresh();
      toast.success("Saved");
    } catch {
      toast.error("Could not save that setting.");
    }
  }

  if (locked) {
    return (
      <AppShell title="Kids Mode" subtitle="Parental controls are PIN protected">
        <div className="surface mx-auto max-w-sm p-6 text-center">
          <ShieldCheck className="mx-auto size-6 text-primary" />
          <h2 className="mt-3 text-sm font-semibold">Enter parental PIN</h2>
          <Input
            className="mt-4 text-center tracking-[0.4em]"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
          <Button
            className="mt-4 w-full"
            onClick={() => {
              if (pin === profile?.parental_pin) {
                setUnlocked(true);
                setPin("");
              } else {
                toast.error("Incorrect PIN");
              }
            }}
          >
            Unlock
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Kids Mode" subtitle="Family-safe experience and parental controls">
      <div className="surface max-w-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Baby className="size-4 text-primary" /> Kids Mode
            </p>
            <p className="text-xs text-muted-foreground">
              Simplified dashboard only — friends, profiles and the activity feed are hidden.
            </p>
          </div>
          <Switch checked={Boolean(profile?.kids_mode)} onCheckedChange={(v) => patch({ kids_mode: v })} />
        </div>

        <div className="mt-6 space-y-4 border-t border-border pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Hide friends list</p>
              <p className="text-xs text-muted-foreground">Removes the imported friends list from this account.</p>
            </div>
            <Switch
              checked={Boolean(profile?.hide_friends_list)}
              onCheckedChange={(v) => patch({ hide_friends_list: v })}
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Hide online status</p>
              <p className="text-xs text-muted-foreground">Presence dots are hidden everywhere.</p>
            </div>
            <Switch
              checked={Boolean(profile?.hide_online_status)}
              onCheckedChange={(v) => patch({ hide_online_status: v })}
            />
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <Label htmlFor="pin">Parental PIN (4 digits)</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {profile?.parental_pin ? "A PIN is set. Enter a new one to change it." : "No PIN set yet."}
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              id="pin"
              className="max-w-[10rem] tracking-[0.4em]"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
            <Button
              onClick={() => {
                if (pin.length !== 4) {
                  toast.error("PIN must be 4 digits.");
                  return;
                }
                void patch({ parental_pin: pin });
                setPin("");
              }}
            >
              Save PIN
            </Button>
            {profile?.parental_pin ? (
              <Button variant="ghost" onClick={() => patch({ parental_pin: null })}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
