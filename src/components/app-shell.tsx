import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Baby,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  Shield,
  Target,
  Users,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshWorkspace, useWorkspace } from "@/hooks/use-workspace";
import { syncNow } from "@/lib/tristat.functions";

const MAIN = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, social: false },
  { title: "Friends", url: "/friends", icon: Users, social: true },
  { title: "Goals", url: "/goals", icon: Target, social: false },
  { title: "Activity Feed", url: "/activity", icon: Activity, social: true },
];

const SYSTEM = [
  { title: "Privacy", url: "/privacy", icon: Shield },
  { title: "Kids Mode", url: "/kids", icon: Baby },
  { title: "Settings", url: "/settings", icon: Settings },
];

function AppSidebar({ kidsMode }: { kidsMode: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = MAIN.filter((i) => !kidsMode || !i.social);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="grid size-8 place-items-center rounded-lg bg-primary font-bold text-primary-foreground">
            T
          </div>
          <div className="truncate text-sm font-semibold">TriStat Tracker</div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SYSTEM.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { data } = useWorkspace();
  const refresh = useRefreshWorkspace();
  const sync = useServerFn(syncNow);
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  const kidsMode = data?.profile?.kids_mode ?? false;

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await sync({});
      await refresh();
      toast.success(res.completed ? `Synced — ${res.completed} goal(s) completed!` : "Platform data synced");
    } catch {
      toast.error("Sync failed. Try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar kidsMode={kidsMode} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold">{title}</h1>
              {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
            <Button variant="secondary" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={syncing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Sync</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
