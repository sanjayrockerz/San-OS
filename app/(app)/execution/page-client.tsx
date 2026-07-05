"use client";

import { useActionState, useState } from "react";
import {
  TrendingUp, TrendingDown, Minus, CheckSquare, Plus,
} from "lucide-react";
import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/charts/progress-ring";
import { ExecutionPlanPanel } from "@/components/dashboard/execution-plan-panel";
import { QuickCaptureWidget } from "@/components/dashboard/quick-capture-widget";
import { VoiceCaptureWidget } from "@/components/dashboard/voice-capture-widget";
import { DailyPlannerPanel, type PlannerPanelState } from "@/components/dashboard/daily-planner-panel";
import { createTimeBlock } from "./actions";
import type { ExecutionMetrics } from "@/lib/services";
import type { Tables } from "@/types/database";
import { cn } from "@/lib/utils";

type TimeBlock = any;
type CaptureItem = any;

interface FinanceSnapshot {
  monthRevenue: number;
  monthExpenses: number;
  monthProfit: number;
  outstandingAr: number;
  pipelineValue: number;
  pipelineWeighted: number;
}

interface Props {
  todayBlocks: TimeBlock[];
  metrics: ExecutionMetrics;
  weeklyReport: {
    weeklyMetrics: ExecutionMetrics[];
    trend: "improving" | "stable" | "declining";
    topInsight: string;
  };
  captureItems: CaptureItem[];
  financeSnapshot: FinanceSnapshot;
  plannerState: PlannerPanelState;
}

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const TREND_COLOR = {
  improving: "text-success",
  stable: "text-muted-foreground",
  declining: "text-danger",
};

function AddBlockForm() {
  const [result, formAction, pending] = useActionState(createTimeBlock, null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        <Plus className="size-4" /> Schedule a time block
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold">New Time Block</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <input
            name="title"
            placeholder="What are you working on?"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
            required
          />
        </div>
        <select
          name="domain"
          defaultValue="personal"
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary/50 focus:outline-none"
        >
          <option value="learning">Learning</option>
          <option value="academic">Academic</option>
          <option value="project">Project</option>
          <option value="business">Business</option>
          <option value="health">Health</option>
          <option value="personal">Personal</option>
        </select>
        <input
          name="estimatedMinutes"
          type="number"
          defaultValue={60}
          min={5}
          max={480}
          placeholder="Minutes"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
        />
        <input
          name="startTime"
          type="time"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
          required
        />
        <input
          name="endTime"
          type="time"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
          required
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Schedule"}
        </button>
      </div>
      {result && !result.ok && (
        <p className="text-xs text-destructive">{result.error}</p>
      )}
    </form>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="surface-card rounded-xl p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular", color)}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function CaptureQueue({ items }: { items: CaptureItem[] }) {
  if (items.length === 0) return null;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="Capture Queue" />
        <p className="mb-3 text-xs text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""} waiting to be processed.
        </p>
        <div className="space-y-1.5">
          {items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2.5 rounded-xl border border-border p-2.5"
            >
              <CheckSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <p className="flex-1 text-xs leading-relaxed">{item.content}</p>
              <Badge variant="secondary">{item.type}</Badge>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function ExecutionPageClient({ todayBlocks, metrics, weeklyReport, captureItems, plannerState }: Props) {
  const TrendIcon = TREND_ICON[weeklyReport.trend];

  return (
    <PageTransition>
      <PageHeader
        title="Execution OS"
        description="Plan, execute, measure, improve."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Completion"
          value={`${metrics.completionRate}%`}
          sub={`${metrics.completedBlocks}/${metrics.totalBlocks} blocks`}
          color={metrics.completionRate >= 70 ? "text-success" : metrics.completionRate >= 40 ? "text-warning" : "text-danger"}
        />
        <MetricCard
          label="Deep Work"
          value={`${metrics.deepWorkMinutes}m`}
          sub={`${metrics.focusSessions} sessions`}
        />
        <MetricCard
          label="Planned"
          value={`${metrics.plannedMinutes}m`}
          sub="scheduled today"
        />
        <MetricCard
          label="Focus Score"
          value={metrics.avgFocusScore || "—"}
          sub="avg today"
          color={metrics.avgFocusScore >= 70 ? "text-success" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <DailyPlannerPanel state={plannerState} />

          <Section>
            <div className="surface-card rounded-2xl p-5">
              <SectionHeading title="Today's Schedule" />
              <div className="mt-2 space-y-3">
                <ExecutionPlanPanel blocks={todayBlocks} />
                <AddBlockForm />
              </div>
            </div>
          </Section>

          {weeklyReport.weeklyMetrics.length > 0 && (
            <Section>
              <div className="surface-card rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <SectionHeading title="Weekly Execution" />
                  <div className="flex items-center gap-1.5">
                    <TrendIcon className={cn("size-4", TREND_COLOR[weeklyReport.trend])} />
                    <span className={cn("text-xs font-medium capitalize", TREND_COLOR[weeklyReport.trend])}>
                      {weeklyReport.trend}
                    </span>
                  </div>
                </div>

                <p className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  {weeklyReport.topInsight}
                </p>

                <div className="space-y-2">
                  {weeklyReport.weeklyMetrics.map((day, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-8 shrink-0 text-[10px] text-muted-foreground">Day {i + 1}</span>
                      <Progress value={day.completionRate} className="h-2 flex-1" />
                      <span className="w-8 shrink-0 text-right text-xs font-medium tabular">
                        {day.completionRate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

          <CaptureQueue items={captureItems} />
        </div>

        <div className="space-y-5">
          <VoiceCaptureWidget />
          <QuickCaptureWidget />

          <Section>
            <div className="surface-card rounded-2xl p-5">
              <SectionHeading title="Today's Performance" />
              <div className="mt-4 flex justify-center">
                <ProgressRing value={metrics.completionRate} size={80} stroke={8}>
                  <span className="text-lg font-bold tabular">{metrics.completionRate}%</span>
                </ProgressRing>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">Schedule Acc.</p>
                  <p className="tabular text-sm font-bold">{metrics.scheduleAccuracy}%</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">Longest Streak</p>
                  <p className="tabular text-sm font-bold">{metrics.longestStreak}</p>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </PageTransition>
  );
}
