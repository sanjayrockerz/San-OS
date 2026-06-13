"use client";

import Link from "next/link";
import {
  Plus,
  Play,
  CalendarCheck,
  AlertTriangle,
  Sparkles,
  Clock,
  Inbox,
} from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PatternBadge } from "@/components/ui/pattern-badge";
import { RadarChart } from "@/components/charts/radar-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { ProgressRing } from "@/components/charts/progress-ring";
import { Sparkline } from "@/components/charts/sparkline";
import { getPatternById } from "@/lib/utils/patterns";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import {
  readiness,
  cognitiveRadar,
  cognitiveStrengths,
  performanceWeekly,
  performanceStats,
  patternConfidence,
  weakAreas,
  upcomingDeadlines,
} from "@/lib/mock-data";

export interface LiveActivityItem {
  id: string;
  text: string;
  time: string;
}

export interface OverviewMetrics {
  totalProblems: number;
  solved: number;
  revisionDue: number;
  solvedThisWeek: number;
  weeklyTarget: number;
  trends: {
    total: number[];
    solved: number[];
    revision: number[];
  };
}

export interface OverviewClientProps {
  name: string;
  metrics: OverviewMetrics;
  activity: LiveActivityItem[];
  latestTitle: string | null;
}

export function OverviewClient({
  name,
  metrics,
  activity,
  latestTitle,
}: OverviewClientProps) {
  const openAddEntry = useUIStore((s) => s.setAddEntryOpen);

  const weeklyPct = metrics.weeklyTarget
    ? Math.min(100, Math.round((metrics.solvedThisWeek / metrics.weeklyTarget) * 100))
    : 0;

  return (
    <PageTransition>
      {/* Hero */}
      <Section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight sm:text-[34px]">
            Welcome back, {name}.
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground text-balance">
            {metrics.revisionDue > 0 ? (
              <>
                You have{" "}
                <span className="font-semibold text-foreground">
                  {metrics.revisionDue} problem{metrics.revisionDue === 1 ? "" : "s"}
                </span>{" "}
                due for revision. Close them out before adding new ones.
              </>
            ) : latestTitle ? (
              <>
                Last logged:{" "}
                <span className="font-semibold text-foreground">{latestTitle}</span>.
                Keep the streak alive.
              </>
            ) : (
              <>Add your first learning entry to start building your engineering OS.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => openAddEntry(true)}>
            <Plus className="size-4" /> Add Learning Entry
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/revision">
              <Play className="size-4" /> Start Revision
            </Link>
          </Button>
        </div>
      </Section>

      {/* Row 1 — live metrics + weekly goal */}
      <Section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Problems"
          value={`${metrics.totalProblems}`}
          trend={metrics.trends.total}
        />
        <MetricCard
          label="Solved"
          value={`${metrics.solved}`}
          trend={metrics.trends.solved}
          color="#34d399"
        />
        <MetricCard
          label="Revision Due"
          value={`${metrics.revisionDue}`}
          trend={metrics.trends.revision}
          color="#fbbf24"
        />
        <div className="surface-card flex items-center gap-4 rounded-2xl p-5">
          <ProgressRing value={weeklyPct} size={92} stroke={9}>
            <span className="text-lg font-bold tabular">
              {metrics.solvedThisWeek}
            </span>
            <span className="text-[10px] text-muted-foreground">
              / {metrics.weeklyTarget}
            </span>
          </ProgressRing>
          <div>
            <p className="text-sm font-semibold">Weekly Goal</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.max(0, metrics.weeklyTarget - metrics.solvedThisWeek)} solves
              left to hit your target.
            </p>
          </div>
        </div>
      </Section>

      {/* Row 2 — cognitive performance (visual) + activity (live) */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section className="lg:col-span-2">
          <div className="surface-card h-full rounded-2xl p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Cognitive Performance
              </h2>
              <Badge variant="secondary">Preview</Badge>
            </div>
            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
              <div className="flex justify-center">
                <RadarChart data={cognitiveRadar} size={230} />
              </div>
              <div className="space-y-3">
                {cognitiveStrengths.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-semibold tabular">{s.value}</span>
                    </div>
                    <Progress
                      value={s.value}
                      indicatorColor={s.color}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="surface-card flex h-full flex-col rounded-2xl p-5">
            <SectionHeading title="Activity" />
            {activity.length > 0 ? (
              <div className="relative space-y-4 pl-1">
                {activity.map((a, i) => (
                  <div key={a.id} className="relative flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="size-2.5 rounded-full bg-primary ring-4 ring-card" />
                      {i < activity.length - 1 && (
                        <span className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="-mt-0.5 pb-1">
                      <p className="text-sm">{a.text}</p>
                      <p className="text-[11px] text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <Inbox className="size-7 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">No activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Log a problem to see your timeline here.
                </p>
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Row 3 — performance overview + AI insight (visual previews) */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section className="lg:col-span-2">
          <div className="surface-card h-full rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Performance Overview
              </h2>
              <Badge variant="secondary">Preview</Badge>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto]">
              <BarChart data={performanceWeekly} color="var(--primary)" height={170} />
              <div className="flex flex-row gap-4 sm:flex-col sm:justify-center sm:border-l sm:border-border sm:pl-5">
                {performanceStats.map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-bold tabular">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="relative h-full overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                AI Insight
              </span>
              <Badge variant="secondary" className="ml-auto">
                Preview
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-balance">
              The AI mentor will analyse your solve history and surface your real
              weakest stage here. Keep logging entries to power it.
            </p>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card/60 p-3">
              <div>
                <p className="text-[11px] text-muted-foreground">
                  Placement readiness
                </p>
                <p className="text-lg font-bold tabular">{readiness.value}%</p>
              </div>
              <Sparkline data={readiness.trend} width={110} height={36} />
            </div>
          </div>
        </Section>
      </div>

      {/* Row 4 — pattern confidence grid (visual preview) */}
      <Section className="mb-6">
        <SectionHeading
          title="Pattern Confidence"
          action={
            <Badge variant="secondary">Preview</Badge>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {patternConfidence.map(({ id, value, lastRevised, weakSub }) => {
            const p = getPatternById(id);
            if (!p) return null;
            return (
              <div
                key={id}
                className="surface-card rounded-2xl p-4"
                style={{ boxShadow: `inset 3px 0 0 ${p.color}` }}
              >
                <div className="flex items-center justify-between">
                  <PatternBadge patternId={id} />
                  <span className="text-lg font-bold tabular">{value}%</span>
                </div>
                <Progress value={value} indicatorColor={p.color} className="mt-3 h-1.5" />
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" /> {lastRevised}
                  </span>
                  <span className="truncate">{weakSub}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Row 5 — weak areas + deadlines (visual previews) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section>
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading
              title="Weak Areas"
              action={<Badge variant="secondary">Preview</Badge>}
            />
            <div className="space-y-3">
              {weakAreas.map((w) => {
                const p = getPatternById(w.id);
                return (
                  <div key={w.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{w.label}</span>
                      <span
                        className="text-sm font-bold tabular"
                        style={{ color: p?.color }}
                      >
                        {w.value}%
                      </span>
                    </div>
                    <Progress value={w.value} indicatorColor={p?.color} className="mt-2 h-1.5" />
                    <p className="mt-2 text-[11px] text-muted-foreground">{w.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        <Section>
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading
              title="Upcoming Deadlines"
              action={<Badge variant="secondary">Preview</Badge>}
            />
            <div className="space-y-2.5">
              {upcomingDeadlines.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      d.urgent
                        ? "bg-danger/12 text-danger"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {d.urgent ? (
                      <AlertTriangle className="size-4" />
                    ) : (
                      <CalendarCheck className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">{d.course}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium",
                      d.urgent ? "text-danger" : "text-muted-foreground",
                    )}
                  >
                    {d.due}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </PageTransition>
  );
}
