import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { QRPanel } from "@/components/QRLabel";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fetchCurrentRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/dashboard/assets/$id")({
  head: () => ({ meta: [{ title: "Asset · MaintainIQ" }] }),
  component: AssetDetail,
});

type Asset = {
  id: string; asset_code: string; name: string; category: string | null;
  location: string | null; condition: string | null; status: string;
  assigned_technician_id: string | null;
  last_service_date: string | null; next_service_date: string | null;
};
type Tech = { id: string; full_name: string | null; email: string | null };
type Issue = { id: string; issue_number: string; title: string; status: string; priority: string; created_at: string };
type History = { id: string; action: string; actor_name: string | null; created_at: string };

function AssetDetail() {
  const { id } = Route.useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [role, setRole] = useState<string | null>(null);

  async function load() {
    const { data: a } = await supabase.from("assets").select("*").eq("id", id).maybeSingle();
    setAsset(a as Asset | null);
    const { data: iss } = await supabase.from("issues").select("id,issue_number,title,status,priority,created_at").eq("asset_id", id).order("created_at", { ascending: false });
    setIssues((iss as Issue[]) ?? []);
    const { data: h } = await supabase.from("asset_history").select("id,action,actor_name,created_at").eq("asset_id", id).order("created_at", { ascending: false }).limit(30);
    setHistory((h as History[]) ?? []);
  }

  useEffect(() => {
    fetchCurrentRole().then(setRole);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (role !== "admin") return;
    (async () => {
      const { data: r } = await supabase.from("user_roles").select("user_id").eq("role", "technician");
      const ids = (r ?? []).map((x) => x.user_id);
      if (ids.length === 0) return setTechs([]);
      const { data: p } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
      setTechs((p as Tech[]) ?? []);
    })();
  }, [role]);

  async function updateStatus(s: string) {
    const { error } = await supabase.from("assets").update({ status: s as Asset["status"] }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    load();
  }

  async function assign(techId: string) {
    const val = techId === "none" ? null : techId;
    const { error } = await supabase.from("assets").update({ assigned_technician_id: val }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Assignment updated");
    load();
  }

  if (!asset) return <div className="text-muted-foreground">Loading…</div>;

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/asset/${asset.asset_code}` : `/asset/${asset.asset_code}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{asset.asset_code}</div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
            <StatusBadge value={asset.status} />
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{asset.category ?? "Uncategorised"} · {asset.location ?? "No location"}</div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-muted-foreground">Manage</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Status</div>
              <Select value={asset.status} onValueChange={updateStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["operational","issue_reported","under_inspection","under_maintenance","out_of_service","retired"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s.replaceAll("_"," ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Assigned technician</div>
              <Select value={asset.assigned_technician_id ?? "none"} onValueChange={assign}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {techs.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name ?? t.email ?? t.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Issues</h2>
          <div className="overflow-hidden rounded-xl border bg-card">
            {issues.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No issues reported for this asset yet.</div>
            ) : issues.map((i) => (
              <Link key={i.id} to="/dashboard/issues/$id" params={{ id: i.id }} className={`flex items-center justify-between border-b p-3 hover:bg-secondary/40 last:border-0 ${i.priority === "critical" ? "bg-destructive/5" : ""}`}>
                <div>
                  <div className="text-xs font-mono text-muted-foreground">{i.issue_number}</div>
                  <div className="font-medium">{i.title}</div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge value={i.priority} kind="priority" />
                  <StatusBadge value={i.status} kind="issue" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">History</h2>
          <div className="rounded-xl border bg-card p-4">
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">No events recorded yet.</div>
            ) : (
              <ol className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <div className="text-sm">{h.action}</div>
                      <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}{h.actor_name ? ` · ${h.actor_name}` : ""}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <QRPanel url={publicUrl} assetName={asset.name} assetCode={asset.asset_code} location={asset.location} />
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-muted-foreground">Service window</h3>
          <div className="mt-2 space-y-1 text-sm">
            <div>Last: <span className="text-muted-foreground">{asset.last_service_date ?? "—"}</span></div>
            <div>Next: <span className="text-muted-foreground">{asset.next_service_date ?? "—"}</span></div>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full">
          <a href={publicUrl} target="_blank" rel="noreferrer">View public asset page</a>
        </Button>
      </div>
    </div>
  );
}
