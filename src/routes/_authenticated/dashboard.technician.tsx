import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/_authenticated/dashboard/technician")({
  head: () => ({ meta: [{ title: "My work · MaintainIQ" }] }),
  component: TechView,
});

type Issue = { id: string; issue_number: string; title: string; priority: string; status: string; created_at: string; asset_id: string };

function TechView() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const { data } = await supabase.from("issues")
        .select("id,issue_number,title,priority,status,created_at,asset_id")
        .eq("assigned_technician_id", userRes.user!.id)
        .order("created_at", { ascending: false });
      setIssues((data as Issue[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">My assigned issues</h1>
      <p className="mt-1 text-muted-foreground">Only issues assigned to you appear here.</p>

      <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-soft">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Nothing assigned yet. New assignments will appear here.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Issue</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i.id} className={`border-b last:border-0 hover:bg-secondary/30 ${i.priority === "critical" ? "bg-destructive/5" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <Link to="/dashboard/issues/$id" params={{ id: i.id }} className="text-primary hover:underline">{i.issue_number}</Link>
                  </td>
                  <td className="px-4 py-2.5">{i.title}</td>
                  <td className="px-4 py-2.5"><StatusBadge value={i.priority} kind="priority" /></td>
                  <td className="px-4 py-2.5"><StatusBadge value={i.status} kind="issue" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
