import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/assets/new")({
  head: () => ({ meta: [{ title: "New asset · MaintainIQ" }] }),
  component: NewAsset,
});

function NewAsset() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    asset_code: "",
    name: "",
    category: "",
    location: "",
    condition: "",
  });
  const [loading, setLoading] = useState(false);

  function upd<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const code = form.asset_code.trim().toUpperCase();
    if (!code) {
      toast.error("Asset code is required");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("assets").insert({
      asset_code: code,
      name: form.name,
      category: form.category || null,
      location: form.location || null,
      condition: form.condition || null,
    }).select("id").single();
    setLoading(false);
    if (error) {
      toast.error(error.code === "23505" ? "That asset code already exists" : error.message);
      return;
    }
    toast.success("Asset created");
    navigate({ to: "/dashboard/assets/$id", params: { id: data.id } });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Register a new asset</h1>
      <p className="mt-1 text-muted-foreground">A QR code will be generated automatically once you save.</p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
        <Field label="Asset code" hint="Unique identifier, e.g. PROJ-014">
          <Input required value={form.asset_code} onChange={(e) => upd("asset_code", e.target.value)} placeholder="PROJ-014" />
        </Field>
        <Field label="Name">
          <Input required value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Epson Projector" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Category">
            <Input value={form.category} onChange={(e) => upd("category", e.target.value)} placeholder="Projector" />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => upd("location", e.target.value)} placeholder="Meeting Room B" />
          </Field>
        </div>
        <Field label="Condition notes">
          <Textarea value={form.condition} onChange={(e) => upd("condition", e.target.value)} placeholder="Purchased 2023, minor lamp dimming reported once" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create asset"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
