import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformBadge } from "@/components/platform";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { linkAccount } from "@/lib/tristat.functions";

export const Route = createFileRoute("/_authenticated/link")({
  head: () => ({
    meta: [
      { title: "Link your accounts — TriStat Tracker" },
      { name: "description", content: "Connect your gaming accounts to unlock your TriStat dashboard." },
      { property: "og:title", content: "Link your accounts — TriStat Tracker" },
      { property: "og:description", content: "Steam and Epic linking is required before tracking begins." },
    ],
  }),
  component: LinkPage,
});

function LinkPage() {
  const { data, isLoading } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const link = useServerFn(linkAccount);
  const navigate = useNavigate();
  const [steam, setSteam] = useState("");
  const [epic, setEpic] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const steamLink = data?.links.find((l) => l.platform === "steam");
  const epicLink = data?.links.find((l) => l.platform === "epic");
  const done = Boolean(steamLink && epicLink);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => navigate({ to: "/dashboard", replace: true }), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [done, navigate]);

  async function connect(platform: "steam" | "epic", handle: string) {
    if (!handle.trim()) return;
    setBusy(platform);
    try {
      const res = await link({ data: { platform, handle } });
      await refresh();
      toast.success(`${platform === "steam" ? "Steam" : "Epic"} linked as ${res.username}`);
    } catch {
      toast.error("Could not link that account.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-2xl place-items-center px-4 py-12">
      <div className="w-full">
        <h1 className="text-2xl font-semibold">Link Steam & Epic to continue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Link the accounts you want to use with TriStat. Imported stats depend on the live platform data that is
          available for that account.
        </p>

        {isLoading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Checking your links…
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="surface p-5">
              <div className="flex items-center justify-between">
                <PlatformBadge platform="steam" />
                {steamLink ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <Check className="size-3.5" /> {steamLink.platform_username}
                  </span>
                ) : null}
              </div>
              {!steamLink && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="steam">Steam profile URL or SteamID64</Label>
                  <div className="flex gap-2">
                    <Input
                      id="steam"
                      placeholder="https://steamcommunity.com/id/yourname"
                      value={steam}
                      onChange={(e) => setSteam(e.target.value)}
                    />
                    <Button onClick={() => connect("steam", steam)} disabled={busy === "steam"}>
                      {busy === "steam" ? <Loader2 className="animate-spin" /> : "Connect"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="surface p-5">
              <div className="flex items-center justify-between">
                <PlatformBadge platform="epic" />
                {epicLink ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <Check className="size-3.5" /> {epicLink.platform_username}
                  </span>
                ) : null}
              </div>
              {!epicLink && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="epic">Epic Games display name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="epic"
                      placeholder="EpicDisplayName"
                      value={epic}
                      onChange={(e) => setEpic(e.target.value)}
                    />
                    <Button onClick={() => connect("epic", epic)} disabled={busy === "epic"}>
                      {busy === "epic" ? <Loader2 className="animate-spin" /> : "Connect"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {done ? <p className="text-sm text-success">Both accounts linked — opening your dashboard…</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
