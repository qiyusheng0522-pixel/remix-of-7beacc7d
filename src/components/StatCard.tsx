import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "destructive" | "info";
}

const tones = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  success: { bg: "bg-success/10", text: "text-success" },
  warning: { bg: "bg-warning/15", text: "text-warning-foreground" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive" },
  info: { bg: "bg-info/10", text: "text-info" },
};

export function StatCard({ icon: Icon, label, value, hint, tone = "primary" }: StatCardProps) {
  const t = tones[tone];
  return (
    <div className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</div>
          {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", t.bg)}>
          <Icon className={cn("h-4.5 w-4.5", t.text)} />
        </div>
      </div>
    </div>
  );
}
