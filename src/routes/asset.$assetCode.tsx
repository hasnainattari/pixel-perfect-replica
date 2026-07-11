import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/asset/$assetCode")({
  head: ({ params }) => ({
    meta: [
      { title: `Asset ${params.assetCode} · MaintainIQ` },
      { name: "description", content: "Public asset page. Scan to view status and report issues." },
    ],
  }),
  component: PublicAsset,
});

type PubAsset = {
  id: string; asset_code: string; name: string; category: string | null;
  location: string | null; condition: string | null; status: string;
  last_service_date: string | null; next_service_date: string | null;
};

function PublicAsset() {
  const { assetCode } = Route.useParams();
  const [asset, setAsset] = useState<PubAsset | null>(null);
  const [history, setHistory] = useState<{ id: string; action: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("public_assets").select("*").eq("asset_code", assetCode).maybeSingle();
      if (!data) { setNotFoundState(true); setLoading(false); return; }
      setAsset(data as PubAsset);
      const { data: h } = await supabase.from("asset_history")
        .select("id,action,created_at")
        .eq("asset_id", data.id as string)
        .order("created_at", { ascending: false })
        .limit(10);
      setHistory(h ?? []);
      setLoading(false);
    })();
  }, [assetCode]);

  if (loading) return <PublicShell><div className="text-muted-foreground">Loading…</div></PublicShell>;

  if (notFoundState || !asset) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-semibold">Asset not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">The code <span className="font-mono">{assetCode}</span> is not registered. Check the QR label or contact the site manager.</p>
        </div>
      </PublicShell>
    );
  }

  const isRetired = asset.status === "retired";

  return (
    <PublicShell>
      <div className="mx-auto max-w-xl space-y-5">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-muted-foreground">{asset.asset_code}</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">{asset.name}</h1>
              <div className="mt-1 text-sm text-muted-foreground">{asset.category ?? ""}{asset.category && asset.location ? " · " : ""}{asset.location ?? ""}</div>
            </div>
            <StatusBadge value={asset.status} />
          </div>
          {asset.condition && (
            <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">{asset.condition}</div>
          )}
          {(asset.last_service_date || asset.next_service_date) && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-2"><div className="text-muted-foreground">Last service</div><div className="font-medium">{asset.last_service_date ?? "—"}</div></div>
              <div className="rounded-md border p-2"><div className="text-muted-foreground">Next service</div><div className="font-medium">{asset.next_service_date ?? "—"}</div></div>
            </div>
          )}
        </div>

        {isRetired ? (
          <div className="rounded-2xl border border-muted bg-muted p-5 text-center text-sm text-muted-foreground">
            This asset has been retired. Issue reporting is disabled.
          </div>
        ) : (
          <Button asChild size="lg" className="w-full">
            <Link to="/asset/$assetCode/report" params={{ assetCode }}>
              Report an issue <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}

        {history.length > 0 && (
          <div className="rounded-2xl border bg-card p-5">
            <div className="mb-3 text-sm font-semibold text-muted-foreground">Recent activity</div>
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
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
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
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
