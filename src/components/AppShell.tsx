import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Wrench, LogOut, Package } from "lucide-react";
import type { AppRole } from "@/lib/roles";

export function AppShell({
  role,
  email,
  children,
}: {
  role: AppRole | null;
  email?: string | null;
  children: ReactNode;
}) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow">
                <Wrench className="h-4 w-4" />
              </span>
              <span>MaintainIQ</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {role === "admin" && (
                <>
                  <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/dashboard/assets/new" icon={<Package className="h-4 w-4" />}>
                    New asset
                  </NavLink>
                </>
              )}
              {role === "technician" && (
                <NavLink to="/dashboard/technician" icon={<Wrench className="h-4 w-4" />}>
                  My work
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {email}
              {role && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">{role}</span>}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "bg-secondary text-foreground" }}
    >
      {icon}
      {children}
    </Link>
  );
}
