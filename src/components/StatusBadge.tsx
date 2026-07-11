import { cn } from "@/lib/utils";

const assetStyles: Record<string, string> = {
  operational: "bg-success/15 text-success border-success/30",
  issue_reported: "bg-warning/15 text-warning-foreground border-warning/40",
  under_inspection: "bg-primary/10 text-primary border-primary/30",
  under_maintenance: "bg-primary/15 text-primary border-primary/30",
  out_of_service: "bg-destructive/15 text-destructive border-destructive/40",
  retired: "bg-muted text-muted-foreground border-border",
};

const issueStyles: Record<string, string> = {
  reported: "bg-warning/15 text-warning-foreground border-warning/40",
  assigned: "bg-primary/10 text-primary border-primary/30",
  inspection_started: "bg-primary/15 text-primary border-primary/30",
  maintenance_in_progress: "bg-primary/20 text-primary border-primary/40",
  waiting_for_parts: "bg-accent text-accent-foreground border-accent",
  resolved: "bg-success/15 text-success border-success/30",
  closed: "bg-muted text-muted-foreground border-border",
  reopened: "bg-destructive/15 text-destructive border-destructive/40",
};

const priorityStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-primary/10 text-primary border-primary/30",
  high: "bg-warning/20 text-warning-foreground border-warning/50",
  critical: "bg-destructive text-destructive-foreground border-destructive shadow-soft",
};

export function StatusBadge({
  value,
  kind = "asset",
  className,
}: {
  value: string;
  kind?: "asset" | "issue" | "priority";
  className?: string;
}) {
  const map = kind === "issue" ? issueStyles : kind === "priority" ? priorityStyles : assetStyles;
  const style = map[value] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize whitespace-nowrap",
        style,
        className,
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
