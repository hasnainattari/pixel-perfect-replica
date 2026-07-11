import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { QrCode, Wrench, Sparkles, ShieldCheck, ScanLine, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow">
              <Wrench className="h-4 w-4" />
            </span>
            MaintainIQ
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-hero opacity-[0.07]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-[1.1fr_1fr] md:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI-assisted triage
            </div>
            <h1 className="mt-4 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
              Every asset. One <span className="bg-gradient-hero bg-clip-text text-transparent">QR scan</span> away from fixed.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Give every projector, AC unit and generator a digital identity. Anyone can scan to report an
              issue — MaintainIQ triages with AI, routes to the right technician, and keeps a permanent
              maintenance history.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Open dashboard <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/issue-status/$issueNumber" params={{ issueNumber: "ISS-00001" }}>
                  Check issue status
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm text-muted-foreground">
              <Stat n="QR" label="Zero-friction reporting" />
              <Stat n="AI" label="Instant triage" />
              <Stat n="RLS" label="Role-based access" />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-card p-6 shadow-glow">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ScanLine className="h-4 w-4 text-primary" />
                Scanned via QR
              </div>
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">PROJ-014 · Meeting Room B</div>
                  <div className="mt-1 text-xl font-semibold">Epson Projector</div>
                </div>
                <span className="inline-flex items-center rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-medium capitalize text-success">
                  operational
                </span>
              </div>
              <div className="mt-5 rounded-xl border bg-secondary/40 p-4">
                <div className="text-xs font-medium text-primary">AI triage</div>
                <div className="mt-1 text-sm font-medium">Bulb likely nearing end of life</div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• Check lamp hours in projector menu</li>
                  <li>• Inspect for dust in filter</li>
                  <li>• Escalate to qualified technician for lamp replacement</li>
                </ul>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-success" /> Full audit trail preserved
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/30 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-3">
          <Feature icon={<QrCode className="h-5 w-5" />} title="QR-first reporting" body="Every asset gets a unique QR that anyone can scan — no app, no login. Just tap and describe the issue." />
          <Feature icon={<Sparkles className="h-5 w-5" />} title="AI triage" body="Complaints become structured tickets in seconds: title, category, priority, likely causes and safe first checks." />
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Roles that stick" body="Admins manage the fleet. Technicians see only their work. History is tamper-resistant by design." />
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-foreground">{n}</div>
      <div className="mt-1">{label}</div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div className="mt-4 text-lg font-semibold">{title}</div>
      <div className="mt-1.5 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}
