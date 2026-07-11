import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Wrench, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/asset/$assetCode/report")({
  head: ({ params }) => ({
    meta: [
      { title: `Report an issue · ${params.assetCode} · MaintainIQ` },
      { name: "description", content: "Report a maintenance issue for this asset." },
    ],
  }),
  component: ReportPage,
});

type AiOut = {
  title: string;
  category: string;
  priority: "low"|"medium"|"high"|"critical";
  possible_causes: string[];
  initial_checks: string[];
  recurring_pattern_warning: string | null;
};

function ReportPage() {
  const { assetCode } = Route.useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<{ id: string; name: string; category: string | null; location: string | null; condition: string | null; status: string } | null>(null);
  const [complaint, setComplaint] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [ai, setAi] = useState<AiOut | null>(null);
  const [aiOriginal, setAiOriginal] = useState<AiOut | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Editable AI fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<AiOut["priority"]>("medium");

  useEffect(() => {
    supabase.from("public_assets").select("id,name,category,location,condition,status").eq("asset_code", assetCode).maybeSingle().then(({ data }) => {
      setAsset(data as never);
    });
  }, [assetCode]);

  async function getAiSuggestions() {
    if (!asset || complaint.trim().length < 5) {
      toast.error("Describe the issue first (at least a few words).");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const { data, error } = await supabase.functions.invoke("ai-triage", {
        body: {
          complaint,
          asset_name: asset.name,
          category: asset.category,
          location: asset.location,
          condition: asset.condition,
        },
      });
      clearTimeout(timer);
      if (error) throw error;
      const parsed = data as AiOut;
      if (!parsed?.title) throw new Error("empty");
      setAi(parsed);
      setAiOriginal(parsed);
      setTitle(parsed.title);
      setCategory(parsed.category ?? "");
      setPriority(parsed.priority ?? "medium");
    } catch {
      setAiError("AI suggestion unavailable, please fill in manually.");
      setAi({ title: "", category: "", priority: "medium", possible_causes: [], initial_checks: [], recurring_pattern_warning: null });
      setAiOriginal(null);
    } finally {
      setAiLoading(false);
    }
  }

  async function submit() {
    if (!asset) return;
    if (!title.trim()) {
      toast.error("Add a title before submitting.");
      return;
    }
    setSubmitting(true);
    const edited = aiOriginal
      ? title !== aiOriginal.title || category !== aiOriginal.category || priority !== aiOriginal.priority
      : false;
    const { data, error } = await supabase.from("issues").insert({
      asset_id: asset.id,
      title,
      description: complaint,
      category: category || null,
      priority,
      reporter_name: reporterName || null,
      reporter_contact: reporterContact || null,
      ai_suggested_title: aiOriginal?.title ?? null,
      ai_suggested_category: aiOriginal?.category ?? null,
      ai_suggested_priority: aiOriginal?.priority ?? null,
      ai_possible_causes: ai?.possible_causes ?? null,
      ai_initial_checks: ai?.initial_checks ?? null,
      ai_was_edited: edited,
    }).select("issue_number").single();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(`Issue ${data.issue_number} reported`);
    navigate({ to: "/issue-status/$issueNumber", params: { issueNumber: data.issue_number } });
  }

  if (!asset) {
    return (
      <Shell>
        <div className="text-muted-foreground">Loading asset…</div>
      </Shell>
    );
  }

  if (asset.status === "retired") {
    return (
      <Shell>
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">This asset has been retired and no longer accepts new issues.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link to="/asset/$assetCode" params={{ assetCode }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {asset.name}
      </Link>

      <h1 className="mt-3 text-2xl font-bold">Report an issue</h1>
      <p className="mt-1 text-sm text-muted-foreground">Describe what you noticed. AI will help structure it before you submit.</p>

      <div className="mt-6 space-y-5 rounded-2xl border bg-card p-6 shadow-soft">
        <div className="space-y-1.5">
          <Label>What's going on?</Label>
          <Textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={5} placeholder="Example: The projector shuts off after 5 minutes and the fan sounds louder than usual." />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Your name (optional)</Label>
            <Input value={reporterName} onChange={(e) => setReporterName(e.target.value)} placeholder="Alex Rivera" />
          </div>
          <div className="space-y-1.5">
            <Label>Contact (optional)</Label>
            <Input value={reporterContact} onChange={(e) => setReporterContact(e.target.value)} placeholder="alex@example.com or +1…" />
          </div>
        </div>

        {!ai && (
          <Button type="button" onClick={getAiSuggestions} disabled={aiLoading} className="w-full">
            <Sparkles className="mr-1.5 h-4 w-4" />
            {aiLoading ? "Analysing…" : "Get AI suggestions"}
          </Button>
        )}

        {aiError && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
            <AlertCircle className="h-4 w-4" /> {aiError}
            <Button size="sm" variant="ghost" onClick={getAiSuggestions} className="ml-auto">Retry</Button>
          </div>
        )}

        {ai && (
          <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-primary">Review & edit before submitting</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as AiOut["priority"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low","medium","high","critical"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {ai.possible_causes.length > 0 && (
              <div>
                <div className="text-sm font-medium">Possible causes</div>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {ai.possible_causes.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {ai.initial_checks.length > 0 && (
              <div>
                <div className="text-sm font-medium">Safe initial checks</div>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {ai.initial_checks.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {ai.recurring_pattern_warning && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                ⚠️ {ai.recurring_pattern_warning}
              </div>
            )}
            <Button type="button" className="w-full" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit issue"}
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
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
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
