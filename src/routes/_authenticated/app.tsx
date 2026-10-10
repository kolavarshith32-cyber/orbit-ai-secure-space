import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Building2, ChevronsLeft, ChevronsRight, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, Plus, Settings, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo, LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OrgContext, ORG_KEY, type Membership } from "@/lib/org";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Workspace — Orbit AI" }, { name: "description", content: "Your Orbit AI workspace." }] }),
  component: AppLayout,
});

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/documents", label: "Documents", icon: FileText },
  { to: "/app/members", label: "Members", icon: Users },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ORG_KEY));

  const { data: memberships, isLoading } = useQuery({
    queryKey: ["memberships", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("role, organization:organizations(*)")
        .eq("user_id", user.id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []).filter((m) => m.organization) as unknown as Membership[];
    },
  });

  useEffect(() => {
    if (memberships && memberships.length === 0) navigate({ to: "/onboarding", replace: true });
  }, [memberships, navigate]);

  const current = useMemo(
    () => memberships?.find((m) => m.organization.id === activeId) ?? memberships?.[0],
    [memberships, activeId],
  );

  if (isLoading || !memberships || !current) {
    return <div className="flex min-h-screen items-center justify-center"><LogoMark className="h-10 w-10 animate-pulse" /></div>;
  }

  const switchOrg = (id: string) => {
    localStorage.setItem(ORG_KEY, id);
    setActiveId(id);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "memberships" });
    navigate({ to: "/app" });
  };

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (isCollapsed: boolean, onNav?: () => void) => (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", isCollapsed && "justify-center px-0")}>
        <Logo to="/app" collapsed={isCollapsed} />
      </div>
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn("flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-2 text-left text-sm hover:bg-sidebar-accent", isCollapsed && "justify-center")}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-xs font-semibold text-primary-foreground">{current.organization.name[0]?.toUpperCase()}</div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1"><div className="truncate font-medium">{current.organization.name}</div><div className="truncate text-xs capitalize text-muted-foreground">{current.role}</div></div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            {memberships.map((m) => (
              <DropdownMenuItem key={m.organization.id} onClick={() => switchOrg(m.organization.id)}>
                <Building2 className="h-4 w-4" /><span className="flex-1 truncate">{m.organization.name}</span>
                <span className="text-xs capitalize text-muted-foreground">{m.role}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/onboarding" })}><Plus className="h-4 w-4" />New organization</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNav}
            activeOptions={{ exact: "exact" in n }}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground", isCollapsed && "justify-center px-0")}
            activeProps={{ className: "bg-sidebar-accent !text-sidebar-foreground" }}
            title={n.label}
          >
            <n.icon className="h-4 w-4 shrink-0" />{!isCollapsed && n.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
          {!isCollapsed && <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{user.email}</div>}
          <Button size="icon" variant="ghost" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut /></Button>
        </div>
      </div>
    </div>
  );

  return (
    <OrgContext.Provider value={{ org: current.organization, role: current.role, memberships, userId: user.id, email: user.email ?? "", switchOrg }}>
      <div className="flex min-h-screen">
        <aside className={cn("sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] md:block", collapsed ? "w-[68px]" : "w-64")}>
          {sidebar(collapsed)}
          <button onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground hover:text-foreground">
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>
        </aside>
        <Sheet open={mobile} onOpenChange={setMobile}>
          <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {sidebar(false, () => setMobile(false))}
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
            <Button size="icon" variant="ghost" onClick={() => setMobile(true)} aria-label="Open menu"><Menu /></Button>
            <span className="truncate font-medium">{current.organization.name}</span>
          </header>
          <main className="flex-1"><Outlet /></main>
        </div>
      </div>
    </OrgContext.Provider>
  );
}
