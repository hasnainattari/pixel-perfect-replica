import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchCurrentRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/dashboard/issues/$id")({
  head: () => ({ meta: [{ title: "Issue · MaintainIQ" }] }),
  component: IssueDetail,
});

// Legal status transitions
const NEXT: Record<string, string[]> = {
  reported: ["assigned", "closed"],
  assigned: ["inspection_started", "closed"],
  inspection_started: ["maintenance_in_progress", "waiting_for_parts", "closed"],
  waiting_for_parts: ["maintenance_in_progress", "closed"],
  maintenance_in_progress: ["resolved", "waiting_for_parts"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["assigned", "inspection_started"],
};

type Issue = {
  id: string; issue_number: string; title: string; description: string; category: string | null;
  priority: string; status: string; asset_id: string;
  reporter_name: string | null; reporter_contact: string | null;
  assigned_technician_id: string | null;
  ai_suggested_title: string | null; ai_possible_causes: string[] | null;
  ai_initial_checks: string[] | null; created_at: string; resolved_at: string | null;
};

function IssueDetail() {
  const { id } = Route.useParams();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [asset, setAsset] = useState<{ name: string; asset_code: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [techs, setTechs] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [mForm, setMForm] = useState({ inspection_notes: "", work_performed: "", parts_used: "", cost: "", final_condition: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: i } = await supabase.from("issues").select("*").eq("id", id).maybeSingle();
    setIssue(i as Issue | null);
    if (i) {
      const { data: a } = await supabase.from("assets").select("name,asset_code").eq("id", i.asset_id).maybeSingle();
      setAsset(a as { name: string; asset_code: string } | null);
      const { count } = await supabase.from("maintenance_records").select("id", { count: "exact", head: true }).eq("issue_id", id);
      setMaintenanceCount(count ?? 0);
    }
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
      setTechs((p as { id: string; full_name: string | null; email: string | null }[]) ?? []);
    })();
  }, [role]);

  async function changeStatus(next: string) {
    if (!issue) return;
    if (issue.status === "closed" && next !== "reopened") {
      return toast.error("Closed issues must be reopened before other changes.");
    }
    if (next === "resolved" && maintenanceCount === 0) {
      return toast.error("Add at least one maintenance record before resolving.");
    }
    const { error } = await supabase.from("issues").update({ status: next as never }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Status → ${next.replaceAll("_", " ")}`);
    load();
  }

  async function assign(techId: string) {
    const val = techId === "none" ? null : techId;
    const patch: Record<string, unknown> = { assigned_technician_id: val };
    if (val && issue?.status === "reported") patch.status = "assigned";
    const { error } = await supabase.from("issues").update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Technician assigned");
    load();
  }

  async function addMaintenance(e: React.FormEvent) {
    e.preventDefault();
    if (!issue) return;
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const costNum = mForm.cost ? Number(mForm.cost) : null;
    if (costNum !== null && costNum < 0) {
      setSaving(false);
      return toast.error("Cost cannot be negative");
    }
    const { error } = await supabase.from("maintenance_records").insert({
      issue_id: issue.id,
      technician_id: userRes.user!.id,
      inspection_notes: mForm.inspection_notes || null,
      work_performed: mForm.work_performed || null,
      parts_used: mForm.parts_used || null,
      cost: costNum,
      final_condition: mForm.final_condition || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Maintenance record added");
    setMForm({ inspection_notes: "", work_performed: "", parts_used: "", cost: "", final_condition: "" });
    load();
  }

  if (!issue) return <div className="text-muted-foreground">Loading…</div>;

  const readOnly = issue.status === "closed";
  const allowedNext = NEXT[issue.status] ?? [];

  return (
    <div className={`grid gap-6 lg:grid-cols-[1.4fr_1fr] ${issue.priority === "critical" ? "rounded-2xl ring-1 ring-destructive/30" : ""}`}>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{issue.issue_number}</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{issue.title}</h1>
            <StatusBadge value={issue.priority} kind="priority" />
            <StatusBadge value={issue.status} kind="issue" />
          </div>
          {asset && (
            <div className="mt-1 text-sm text-muted-foreground">
              on <Link to="/dashboard/assets/$id" params={{ id: issue.asset_id }} className="text-primary hover:underline">{asset.name} · {asset.asset_code}</Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="text-sm font-semibold text-muted-foreground">Description</div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{issue.description}</p>
          {issue.category && <div className="mt-3 text-xs text-muted-foreground">Category: <span className="text-foreground">{issue.category}</span></div>}
          {(issue.reporter_name || issue.reporter_contact) && (
            <div className="mt-3 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
              Reported by <span className="text-foreground">{issue.reporter_name ?? "Anonymous"}</span>
              {issue.reporter_contact && <> · {issue.reporter_contact}</>}
            </div>
          )}
        </div>

        {(issue.ai_possible_causes?.length || issue.ai_initial_checks?.length) && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-primary">AI Triage</div>
            {issue.ai_possible_causes && (
              <div className="mt-3">
                <div className="text-sm font-semibold">Possible causes</div>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {issue.ai_possible_causes.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {issue.ai_initial_checks && (
              <div className="mt-3">
                <div className="text-sm font-semibold">Initial checks</div>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {issue.ai_initial_checks.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {!readOnly && (
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-muted-foreground">Add maintenance record</h2>
            <form onSubmit={addMaintenance} className="mt-3 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5"><Label>Inspection notes</Label><Textarea value={mForm.inspection_notes} onChange={(e) => setMForm(f => ({ ...f, inspection_notes: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Work performed</Label><Textarea value={mForm.work_performed} onChange={(e) => setMForm(f => ({ ...f, work_performed: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Parts used</Label><Input value={mForm.parts_used} onChange={(e) => setMForm(f => ({ ...f, parts_used: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Cost</Label><Input type="number" min="0" step="0.01" value={mForm.cost} onChange={(e) => setMForm(f => ({ ...f, cost: e.target.value }))} /></div>
                <div className="space-y-1.5 md:col-span-2"><Label>Final condition</Label><Input value={mForm.final_condition} onChange={(e) => setMForm(f => ({ ...f, final_condition: e.target.value }))} /></div>
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add record"}</Button>
              <p className="text-xs text-muted-foreground">Records added: {maintenanceCount}. At least one required before resolving.</p>
            </form>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-muted-foreground">Workflow</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {allowedNext.length === 0 ? (
              <span className="text-xs text-muted-foreground">No further transitions.</span>
            ) : allowedNext.map((s) => (
              <Button key={s} size="sm" variant={s === "resolved" ? "default" : "secondary"} onClick={() => changeStatus(s)}>
                → {s.replaceAll("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {role === "admin" && (
          <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-muted-foreground">Assign technician</h3>
            <div className="mt-3">
              <Select value={issue.assigned_technician_id ?? "none"} onValueChange={assign}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {techs.map((t) => <SelectItem key={t.id} value={t.id}>{t.full_name ?? t.email ?? t.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="rounded-2xl border bg-card p-5 shadow-soft text-xs text-muted-foreground">
          <div>Reported: {new Date(issue.created_at).toLocaleString()}</div>
          {issue.resolved_at && <div>Resolved: {new Date(issue.resolved_at).toLocaleString()}</div>}
        </div>
      </div>
    </div>
  );
}
