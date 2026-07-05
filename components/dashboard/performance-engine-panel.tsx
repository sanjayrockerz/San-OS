import { Zap, Target, Brain, Flame } from "lucide-react";
import { Section } from "@/components/layout/page-transition";
import { ProgressRing } from "@/components/charts/progress-ring";
import type { ExecutionMetrics } from "@/lib/services";

interface PerformanceScore {
  executionScore: number;
  focusScore: number;
  consistencyScore: number;
}

function computePerformanceScores(
  metrics: ExecutionMetrics,
  streak: number,
): PerformanceScore {
  const executionScore = Math.round(
    metrics.completionRate * 0.5 + Math.min(100, metrics.scheduleAccuracy) * 0.3 + Math.min(100, metrics.focusSessions * 10) * 0.2,
  );
  const focusScore = metrics.avgFocusScore;
  const consistencyScore = Math.min(100, streak * 10);
  return { executionScore, focusScore, consistencyScore };
}

export function PerformanceEnginePanel({
  metrics,
  streak,
}: {
  metrics: ExecutionMetrics;
  streak: number;
}) {
  const scores = computePerformanceScores(metrics, streak);

  const tiles = [
    { label: "Execution", value: scores.executionScore, icon: Zap, color: "text-primary" },
    { label: "Focus", value: scores.focusScore, icon: Brain, color: "text-teal-500" },
    { label: "Consistency", value: scores.consistencyScore, icon: Flame, color: "text-amber-500" },
  ];

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="size-4.5 text-primary" />
            <h2 className="text-section">Performance Engine</h2>
          </div>
          <span className="text-xs text-muted-foreground">Today</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {tiles.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-border p-3">
              <ProgressRing value={value} size={52} stroke={5}>
                <span className="text-xs font-bold tabular">{value}</span>
              </ProgressRing>
              <div className="flex items-center gap-1">
                <Icon className={`size-3 ${color}`} />
                <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-[10px] text-muted-foreground">Deep Work</p>
            <p className="tabular text-sm font-bold">{metrics.deepWorkMinutes}m</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2">
            <p className="text-[10px] text-muted-foreground">Completion</p>
            <p className="tabular text-sm font-bold">{metrics.completionRate}%</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
