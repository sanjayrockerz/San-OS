import { Sparkline } from "@/components/charts/sparkline";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  trend: number[];
  color?: string;
}

export function MetricCard({ label, value, delta, trend, color = "var(--primary)" }: MetricCardProps) {
  return (
    <div className="surface-card flex flex-col justify-between rounded-2xl p-5 transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {delta && (
          <span className="rounded-full bg-success/12 px-1.5 py-0.5 text-[11px] font-semibold text-success">
            {delta}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-[28px] font-bold leading-none tracking-tight tabular">{value}</span>
        <Sparkline data={trend} color={color} width={96} height={34} />
      </div>
    </div>
  );
}
