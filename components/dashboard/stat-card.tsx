import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export function StatCard({ icon: Icon, label, value, sub, accent = "#6366f1" }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80">
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className="flex size-7 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {sub && <span className={cn("text-sm text-muted-foreground")}>{sub}</span>}
      </div>
    </div>
  );
}
