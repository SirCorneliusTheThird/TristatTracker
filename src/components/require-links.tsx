import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";

export function RequireLinks({ children }: { children: ReactNode }) {
  const { data, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading your stats…
      </div>
    );
  }

  const hasBoth =
    Boolean(data?.links.some((l) => l.platform === "steam")) &&
    Boolean(data?.links.some((l) => l.platform === "epic"));

  if (!hasBoth) {
    return (
      <div className="surface p-8 text-center">
        <h2 className="text-lg font-semibold">Account linking required</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Link both your Steam and Epic Games accounts to unlock the dashboard, friends, goals and activity feed.
        </p>
        <Button asChild className="mt-5">
          <Link to="/link">Link accounts</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

export function KidsBlocked({ feature }: { feature: string }) {
  return (
    <div className="surface p-8 text-center">
      <h2 className="text-lg font-semibold">{feature} is turned off</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Kids Mode is active on this account, so social features are hidden. Turn it off in Kids Mode settings.
      </p>
      <Button asChild variant="secondary" className="mt-5">
        <Link to="/kids">Open Kids Mode</Link>
      </Button>
    </div>
  );
}
