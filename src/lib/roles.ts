import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "technician";

export async function fetchCurrentRole(): Promise<AppRole | null> {
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return null;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .maybeSingle();
  return (data?.role as AppRole) ?? null;
}
