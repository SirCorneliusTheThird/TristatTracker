import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, LogOut, Unlink } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PlatformBadge, relative } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { linkAccount, unlinkAccount, updateProfile } from "@/lib/tristat.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TriStat Tracker" },
      { name: "description", content: "Manage your display name and linked Steam and Epic Games accounts." },
      { property: "og:title", content: "Settings — TriStat Tracker" },
      { property: "og:description", content: "Linked account status and profile settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const save = useServerFn(updateProfile);
  const link = useServerFn(linkAccount);
  const unlink = useServerFn(unlinkAccount);
  const navigate = useNavigate();

  const [name, setName] = useState(data?.profile?.display_name ?? "");
  const [handles, setHandles] = useState<Record<string, string>>({ steam: "", epic: "" });

  const platforms: ("steam" | "epic")[] = ["steam", "epic"];

  return (
    <AppShell title="Settings" subtitle="Profile and linked accounts">
      <div className="grid max-w-3xl gap-4">
        <section className="surface p-6">
          <Label htmlFor="name">Display name</Label>
          <div className="mt-2 flex gap-2">
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm" />
            <Button
              onClick={async () => {
                await save({ data: { display_name: name } });
                await refresh();
                toast.success("Profile updated");
              }}
            >
              Save
            </Button>
          </div>
        </section>

        <section className="surface p-6">
          <h2 className="text-sm font-semibold">Linked accounts</h2>
          <div className="mt-4 space-y-4">
            {platforms.map((p) => {
              const l = data?.links.find((x) => x.platform === p);
              return (
                <div key={p} className="rounded-lg border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <PlatformBadge platform={p} />
                    {l ? (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <Check className="size-3.5" /> {l.platform_username} · synced {relative(l.last_synced_at)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await unlink({ data: { platform: p } });
                            await refresh();
                            toast.success("Unlinked");
                          }}
                        >
                          <Unlink /> Unlink
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not linked</span>
                    )}
                  </div>
                  {!l ? (
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder={p === "steam" ? "Steam profile URL or SteamID64" : "Epic display name"}
                        value={handles[p] ?? ""}
                        onChange={(e) => setHandles((h) => ({ ...h, [p]: e.target.value }))}
                      />
                      <Button
                        onClick={async () => {
                          await link({ data: { platform: p, handle: handles[p] ?? "" } });
                          await refresh();
                          toast.success("Linked");
                        }}
                      >
                        Connect
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface p-6">
          <Button
            variant="secondary"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
          >
            <LogOut /> Sign out
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
