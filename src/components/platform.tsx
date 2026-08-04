import { Gamepad2, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export type Platform = "steam" | "epic";

export function hours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  if (h < 1000) return `${h}h`;
  return `${(h / 1000).toFixed(1)}k h`;
}

export function relative(iso: string | null | undefined) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.round(d / 30)}mo ago`;
}

export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  const isSteam = platform === "steam";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        isSteam
          ? "border-steam/40 bg-steam/15 text-steam"
          : "border-epic/30 bg-epic/10 text-epic",
        className,
      )}
    >
      {isSteam ? <Monitor className="size-3" /> : <Gamepad2 className="size-3" />}
      {isSteam ? "Steam" : "Epic"}
    </span>
  );
}

const PRESENCE_LABEL: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  "in-game": "In game",
  idle: "Idle",
};

export function PresenceDot({ status, hidden }: { status: string; hidden?: boolean }) {
  if (hidden) return <span className="text-xs text-muted-foreground">Status hidden</span>;
  const color =
    status === "in-game"
      ? "bg-success"
      : status === "online"
        ? "bg-primary"
        : status === "idle"
          ? "bg-warning"
          : "bg-muted-foreground";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-2 rounded-full", color)} />
      {PRESENCE_LABEL[status] ?? status}
    </span>
  );
}
