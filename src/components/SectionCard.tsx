import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: string;
}

export function SectionCard({ title, description, action, children, className, accent }: SectionCardProps) {
  return (
    <section
      className={cn("overflow-hidden rounded-xl border bg-card", className)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <header className="flex items-center justify-between gap-3 border-b bg-gradient-to-b from-muted/40 to-transparent px-5 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {accent && <div className={cn("h-5 w-1 rounded-full", accent)} />}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
            {description && <p className="text-[11px] text-muted-foreground truncate">{description}</p>}
          </div>
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}
