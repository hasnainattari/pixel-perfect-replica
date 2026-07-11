import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import { fetchCurrentRole } from "@/lib/roles";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · MaintainIQ" },
      { name: "description", content: "Sign in or create your MaintainIQ staff account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "technician">("technician");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetchCurrentRole();
      if (r) navigate({ to: r === "admin" ? "/dashboard" : "/dashboard/technician", replace: true });
    })();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created — signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.invalidate();
      const r = await fetchCurrentRole();
      navigate({ to: r === "admin" ? "/dashboard" : "/dashboard/technician", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-glow">
            <Wrench className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">MaintainIQ</h1>
          <p className="mt-1 text-sm text-muted-foreground">Staff sign-in for admins and technicians</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="mb-4 grid grid-cols-2 rounded-lg bg-secondary p-1 text-sm">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 transition ${mode === "signin" ? "bg-background shadow-soft font-medium" : "text-muted-foreground"}`}
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 transition ${mode === "signup" ? "bg-background shadow-soft font-medium" : "text-muted-foreground"}`}
              onClick={() => setMode("signup")}
            >
              Create account
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as "admin" | "technician")} className="grid grid-cols-2 gap-2">
                    <label className={`flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm ${role === "technician" ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value="technician" /> Technician
                    </label>
                    <label className={`flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm ${role === "admin" ? "border-primary bg-primary/5" : ""}`}>
                      <RadioGroupItem value="admin" /> Admin
                    </label>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">The first account created automatically becomes admin.</p>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
