"use client";

import { cn } from "@/lib/utils";

interface HeatmapProps {
  /** intensity values 0-4, week-major (length = weeks * 7) */
  data: number[];
  weeks?: number;
  color?: string;
  className?: string;
}

export function Heatmap({ data, weeks = 16, color = "var(--primary)", className }: HeatmapProps) {
  const levelOpacity = [0.06, 0.28, 0.5, 0.72, 1];

  const columns: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(data.slice(w * 7, w * 7 + 7));
  }

  return (
    <div className={cn("flex gap-[3px]", className)}>
      {columns.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((level, di) => (
            <span
              key={di}
              className="size-[11px] rounded-[3px]"
              style={{
                backgroundColor: level === 0 ? "var(--muted)" : color,
                opacity: level === 0 ? 1 : levelOpacity[level],
              }}
              title={`${level} sessions`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
