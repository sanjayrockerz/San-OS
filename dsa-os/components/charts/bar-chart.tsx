"use client";

import { cn } from "@/lib/utils";

interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  className?: string;
}

export function BarChart({ data, color = "var(--primary)", height = 180, className }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value)) || 1;

  return (
    <div className={cn("flex w-full items-end gap-2", className)} style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="relative flex w-full flex-1 items-end">
            <div
              className="w-full rounded-md transition-all duration-300 group-hover:opacity-100"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: `linear-gradient(to top, ${color}, color-mix(in srgb, ${color} 45%, transparent))`,
                opacity: 0.85,
              }}
            >
              <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular opacity-0 transition-opacity group-hover:opacity-100">
                {d.value}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
