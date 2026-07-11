import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCurrentRole } from "@/lib/roles";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, AlertTriangle, Wrench, CircleCheck, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · MaintainIQ" }] }),
  component: Dashboard,
});

type Asset = {
  id: string; asset_code: string; name: string; category: string | null;
  location: string | null; status: string;
};
type Issue = {
  id: string; issue_number: string; title: string; priority: string; status: string;
  asset_id: string; assigned_technician_id: string | null; created_at: string;
};

function Dashboard() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [assetQ, setAssetQ] = useState("");
  const [assetStatus, setAssetStatus] = useState("all");
  const [issueStatus, setIssueStatus] = useState("all");
  const [issuePriority, setIssuePriority] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const role = await fetchCurrentRole();
      if (role === "technician") {
        navigate({ to: "/dashboard/technician", replace: true });
        return;
      }
      const [a, i] = await Promise.all([
        supabase.from("assets").select("id,asset_code,name,category,location,status").order("created_at", { ascending: false }),
        supabase.from("issues").select("id,issue_number,title,priority,status,asset_id,assigned_technician_id,created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      setAssets((a.data as Asset[]) ?? []);
      setIssues((i.data as Issue[]) ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const filteredAssets = assets.filter((a) => {
    if (assetStatus !== "all" && a.status !== assetStatus) return false;
    if (assetQ && !`${a.name} ${a.asset_code} ${a.location ?? ""}`.toLowerCase().includes(assetQ.toLowerCase())) return false;
    return true;
  });

  const filteredIssues = issues.filter((i) => {
    if (issueStatus !== "all" && i.status !== issueStatus) return false;
    if (issuePriority !== "all" && i.priority !== issuePriority) return false;
    return true;
  });

  const stats = {
    total: assets.length,
    open: issues.filter((i) => !["resolved", "closed"].includes(i.status)).length,
    critical: issues.filter((i) => i.priority === "critical" && !["resolved", "closed"].includes(i.status)).length,
    inMaint: assets.filter((a) => a.status === "under_maintenance").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet overview</h1>
          <p className="mt-1 text-muted-foreground">Every asset, issue, and technician assignment in one place.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/assets/new"><Plus className="mr-1.5 h-4 w-4" /> New asset</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Package className="h-4 w-4" />} label="Total assets" value={stats.total} tone="primary" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Open issues" value={stats.open} tone="warning" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Critical" value={stats.critical} tone="destructive" />
        <StatCard icon={<Wrench className="h-4 w-4" />} label="Under maintenance" value={stats.inMaint} tone="primary" />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Assets</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" value={assetQ} onChange={(e) => setAssetQ(e.target.value)} className="pl-8 w-56" />
            </div>
            <Select value={assetStatus} onValueChange={setAssetStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["all","operational","issue_reported","under_inspection","under_maintenance","out_of_service","retired"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replaceAll("_"," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filteredAssets.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No assets yet. Register your first one to generate a QR code.</td></tr>
              ) : filteredAssets.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-2.5 font-mono text-xs">{a.asset_code}</td>
                  <td className="px-4 py-2.5">
                    <Link to="/dashboard/assets/$id" params={{ id: a.id }} className="font-medium text-primary hover:underline">
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{a.category ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{a.location ?? "—"}</td>
                  <td className="px-4 py-2.5"><StatusBadge value={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Issues</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={issueStatus} onValueChange={setIssueStatus}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {["all","reported","assigned","inspection_started","maintenance_in_progress","waiting_for_parts","resolved","closed","reopened"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replaceAll("_"," ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={issuePriority} onValueChange={setIssuePriority}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                {["all","low","medium","high","critical"].map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Issue</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Reported</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : filteredIssues.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No issues match those filters.</td></tr>
              ) : filteredIssues.map((i) => (
                <tr key={i.id} className={`border-b last:border-0 hover:bg-secondary/30 ${i.priority === "critical" ? "bg-destructive/5" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <Link to="/dashboard/issues/$id" params={{ id: i.id }} className="text-primary hover:underline">{i.issue_number}</Link>
                  </td>
                  <td className="px-4 py-2.5">{i.title}</td>
                  <td className="px-4 py-2.5"><StatusBadge value={i.priority} kind="priority" /></td>
                  <td className="px-4 py-2.5"><StatusBadge value={i.status} kind="issue" /></td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(i.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary"|"warning"|"destructive" }) {
  const toneCls = tone === "destructive" ? "bg-destructive/10 text-destructive" : tone === "warning" ? "bg-warning/20 text-warning-foreground" : "bg-primary/10 text-primary";
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${toneCls}`}>{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}
