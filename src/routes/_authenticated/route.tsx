import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { fetchCurrentRole, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    fetchCurrentRole().then(setRole);
  }, []);

  return (
    <AppShell role={role} email={user.email}>
      <Outlet />
    </AppShell>
  );
}
