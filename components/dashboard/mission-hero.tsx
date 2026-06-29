import { Clock, Zap } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { ProgressRing } from "@/components/charts/progress-ring";

function greetingNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Quiet greeting strip — name + three at-a-glance stat pills (readiness,
 * deep work time, streak). No buttons here: the global Add Entry action
 * already lives in the top header, and the page's one real CTA is
 * Today's Focus directly below.
 */
export function MissionHero({
  name,
  readiness,
  weeklyReadinessGain,
  estimatedMinutes,
  streak,
}: {
  name: string;
  readiness: number;
  weeklyReadinessGain: number;
  estimatedMinutes: number;
  streak: number;
}) {
  return (
    <Section className="mb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-display">
            {greetingNow()}, <span className="text-primary">{name}.</span>
          </h1>
          <p className="mt-1 text-body text-muted-foreground">Let&apos;s finish strong today.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="surface-card flex items-center gap-3 rounded-xl px-4 py-2.5">
            <ProgressRing value={readiness} size={40} stroke={5}>
              <span className="text-xs font-bold tabular">{readiness}%</span>
            </ProgressRing>
            <div>
              <p className="text-xs text-muted-foreground">Placement Readiness</p>
              {weeklyReadinessGain > 0 && (
                <p className="text-xs font-medium text-success">↑ {weeklyReadinessGain}% this week</p>
              )}
            </div>
          </div>

          <div className="surface-card flex items-center gap-3 rounded-xl px-4 py-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Clock className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Deep Work Time</p>
              <p className="text-sm font-semibold">{estimatedMinutes} min <span className="text-xs font-normal text-muted-foreground">today</span></p>
            </div>
          </div>

          <div className="surface-card flex items-center gap-3 rounded-xl px-4 py-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-warning/12 text-warning">
              <Zap className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Learning Streak</p>
              <p className="text-sm font-semibold">
                {streak} day{streak === 1 ? "" : "s"} <span className="text-xs font-normal text-muted-foreground">Keep it going!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
