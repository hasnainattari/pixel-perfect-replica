import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { Wrench, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/issue-status/$issueNumber")({
  head: ({ params }) => ({
    meta: [
      { title: `Issue ${params.issueNumber} · MaintainIQ` },
      { name: "description", content: "Track the status of your reported issue." },
    ],
  }),
  component: IssueStatus,
});

type Row = {
  issue_number: string; title: string; description: string; priority: string; status: string;
  created_at: string; resolved_at: string | null; asset_id: string;
};

function IssueStatus() {
  const { issueNumber } = Route.useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Row | null>(null);
  const [asset, setAsset] = useState<{ name: string; asset_code: string } | null>(null);
  const [history, setHistory] = useState<{ id: string; action: string; created_at: string }[]>([]);
  const [lookup, setLookup] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("issues")
        .select("issue_number,title,description,priority,status,created_at,resolved_at,asset_id")
        .eq("issue_number", issueNumber)
        .maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setIssue(data as Row);
      const { data: a } = await supabase.from("public_assets").select("name,asset_code").eq("id", data.asset_id).maybeSingle();
      setAsset(a as { name: string; asset_code: string } | null);
      const { data: h } = await supabase.from("asset_history").select("id,action,created_at").eq("asset_id", data.asset_id).order("created_at", { ascending: false }).limit(15);
      setHistory(h ?? []);
      setLoading(false);
    })();
  }, [issueNumber]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow"><Wrench className="h-3.5 w-3.5" /></span>
            MaintainIQ
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <form
          onSubmit={(e) => { e.preventDefault(); if (lookup) navigate({ to: "/issue-status/$issueNumber", params: { issueNumber: lookup.trim().toUpperCase() } }); }}
          className="mb-6 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Enter issue number, e.g. ISS-00001" className="pl-8" value={lookup} onChange={(e) => setLookup(e.target.value)} />
          </div>
          <Button type="submit">Look up</Button>
        </form>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : notFound || !issue ? (
          <div className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">Issue not found. Double-check the number on your receipt.</div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="text-xs font-mono text-muted-foreground">{issue.issue_number}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{issue.title}</h1>
                <StatusBadge value={issue.priority} kind="priority" />
                <StatusBadge value={issue.status} kind="issue" />
              </div>
              {asset && <div className="mt-1 text-sm text-muted-foreground">on {asset.name} · {asset.asset_code}</div>}
              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">{issue.description}</p>
              <div className="mt-4 text-xs text-muted-foreground">
                Reported {new Date(issue.created_at).toLocaleString()}
                {issue.resolved_at && <> · resolved {new Date(issue.resolved_at).toLocaleString()}</>}
              </div>
            </div>

            {history.length > 0 && (
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-3 text-sm font-semibold text-muted-foreground">Asset activity</div>
                <ol className="space-y-3">
                  {history.map((h) => (
                    <li key={h.id} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <div className="text-sm">{h.action}</div>
                        <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
