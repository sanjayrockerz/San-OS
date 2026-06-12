"use client";

import {
  Plus,
  Play,
  CalendarCheck,
  Check,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Clock,
  TrendingUp,
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
import {
  user,
  readiness,
  summaryMetrics,
  weeklyGoal,
  todaysPlan,
  cognitiveRadar,
  cognitiveStrengths,
  performanceWeekly,
  performanceStats,
  patternConfidence,
  recentActivity,
  weakAreas,
  upcomingDeadlines,
} from "@/lib/mock-data";

export default function OverviewPage() {
  return (
    <PageTransition>
      {/* Hero */}
      <Section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight sm:text-[34px]">
            Good Morning, {user.name}.
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground text-balance">
            You&apos;re <span className="font-semibold text-foreground">{readiness.value}% placement-ready</span>. One
            revision session can improve your weakest topic today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button><Plus className="size-4" /> Add Problem</Button>
          <Button variant="secondary"><Play className="size-4" /> Start Revision</Button>
          <Button variant="ghost"><CalendarCheck className="size-4" /> Today&apos;s Plan</Button>
        </div>
      </Section>

      {/* Row 1 — metrics + weekly goal */}
      <Section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <MetricCard label="Overall Progress" value={`${summaryMetrics.overallProgress.value}%`} delta="+6%" trend={summaryMetrics.overallProgress.trend} />
        <MetricCard label="Problems Solved" value={`${summaryMetrics.problemsSolved.value}`} delta="+12" trend={summaryMetrics.problemsSolved.trend} color="#34d399" />
        <MetricCard label="Revision Pending" value={`${summaryMetrics.revisionPending.value}`} trend={summaryMetrics.revisionPending.trend} color="#fbbf24" />
        <div className="surface-card flex items-center gap-4 rounded-2xl p-5">
          <ProgressRing value={Math.round((weeklyGoal.done / weeklyGoal.total) * 100)} size={92} stroke={9}>
            <span className="text-lg font-bold tabular">{weeklyGoal.done}</span>
            <span className="text-[10px] text-muted-foreground">/ {weeklyGoal.total}</span>
          </ProgressRing>
          <div>
            <p className="text-sm font-semibold">Weekly Goal</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {weeklyGoal.total - weeklyGoal.done} problems left to hit your target.
            </p>
          </div>
        </div>
      </Section>

      {/* Row 2 — cognitive performance + today's plan */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section className="lg:col-span-2">
          <div className="surface-card h-full rounded-2xl p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Cognitive Performance</h2>
              <Badge variant="secondary">This Week</Badge>
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
                    <Progress value={s.value} indicatorColor={s.color} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="surface-card flex h-full flex-col rounded-2xl p-5">
            <SectionHeading title="Today's Plan" action={<span className="text-xs text-muted-foreground">{todaysPlan.filter((t) => t.done).length}/{todaysPlan.length}</span>} />
            <div className="flex flex-1 flex-col gap-2">
              {todaysPlan.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border p-3 transition-colors",
                    t.done ? "bg-background-subtle/40" : "bg-card hover:border-border-strong"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border",
                      t.done ? "border-success bg-success text-success-foreground" : "border-border"
                    )}
                  >
                    {t.done && <Check className="size-3.5" />}
                  </span>
                  <span className={cn("flex-1 text-sm", t.done && "text-muted-foreground line-through")}>{t.label}</span>
                  <Badge variant="outline" className="shrink-0">{t.tag}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Row 3 — performance overview + AI insight */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section className="lg:col-span-2">
          <div className="surface-card h-full rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Performance Overview</h2>
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <TrendingUp className="size-3.5" /> +18% vs last week
              </span>
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
              <span className="text-xs font-semibold uppercase tracking-wider">AI Insight</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-balance">
              You understand patterns well, but your <span className="font-semibold">implementation speed is 1.8× slower</span> than your average. Focus today on{" "}
              <span className="font-semibold text-primary">{readiness.weakest}</span>.
            </p>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card/60 p-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Placement readiness</p>
                <p className="text-lg font-bold tabular">{readiness.value}%</p>
              </div>
              <Sparkline data={readiness.trend} width={110} height={36} />
            </div>
          </div>
        </Section>
      </div>

      {/* Row 4 — pattern confidence grid */}
      <Section className="mb-6">
        <SectionHeading title="Pattern Confidence" action={<button className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">View all <ChevronRight className="size-3.5" /></button>} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {patternConfidence.map(({ id, value, lastRevised, weakSub }) => {
            const p = getPatternById(id);
            if (!p) return null;
            return (
              <div key={id} className="surface-card rounded-2xl p-4" style={{ boxShadow: `inset 3px 0 0 ${p.color}` }}>
                <div className="flex items-center justify-between">
                  <PatternBadge patternId={id} />
                  <span className="text-lg font-bold tabular">{value}%</span>
                </div>
                <Progress value={value} indicatorColor={p.color} className="mt-3 h-1.5" />
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="size-3" /> {lastRevised}</span>
                  <span className="truncate">{weakSub}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Row 5 — activity timeline + weak areas + deadlines */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section>
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading title="Activity" />
            <div className="relative space-y-4 pl-1">
              {recentActivity.map((a, i) => {
                const p = getPatternById(a.patternId);
                return (
                  <div key={a.id} className="relative flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="size-2.5 rounded-full ring-4 ring-card" style={{ backgroundColor: p?.color }} />
                      {i < recentActivity.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="-mt-0.5 pb-1">
                      <p className="text-sm">{a.text}</p>
                      <p className="text-[11px] text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        <Section>
          <div className="surface-card h-full rounded-2xl p-5">
            <SectionHeading title="Weak Areas" />
            <div className="space-y-3">
              {weakAreas.map((w) => {
                const p = getPatternById(w.id);
                return (
                  <div key={w.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{w.label}</span>
                      <span className="text-sm font-bold tabular" style={{ color: p?.color }}>{w.value}%</span>
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
            <SectionHeading title="Upcoming Deadlines" />
            <div className="space-y-2.5">
              {upcomingDeadlines.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", d.urgent ? "bg-danger/12 text-danger" : "bg-muted text-muted-foreground")}>
                    {d.urgent ? <AlertTriangle className="size-4" /> : <CalendarCheck className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">{d.course}</p>
                  </div>
                  <span className={cn("shrink-0 text-xs font-medium", d.urgent ? "text-danger" : "text-muted-foreground")}>{d.due}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </PageTransition>
  );
}
