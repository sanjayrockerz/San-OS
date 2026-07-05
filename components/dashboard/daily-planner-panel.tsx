"use client";

import { useActionState } from "react";
import {
  CalendarClock, Sunrise, RefreshCw, Moon, Sparkles, Target, CheckCircle2, XCircle,
} from "lucide-react";
import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { runPlannerPhase, type PlannerPhase } from "@/app/(app)/execution/actions";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type DailyPlan = Tables<"daily_plans">;

export interface PlannerPanelState {
  today: DailyPlan | null;
  tomorrow: DailyPlan | null;
  recent: DailyPlan[];
}

const PHASES: { phase: PlannerPhase; label: string; icon: typeof Sunrise; hint: string }[] = [
  { phase: "morning", label: "Plan today", icon: Sunrise, hint: "Rebuild today from current priorities" },
  { phase: "replan", label: "Replan now", icon: RefreshCw, hint: "Recover the rest of the day if you're behind" },
  { phase: "review", label: "End-of-day review", icon: Moon, hint: "Review today & draft tomorrow" },
  { phase: "tomorrow", label: "Draft tomorrow", icon: CalendarClock, hint: "Generate tomorrow's optimal schedule" },
];

function PlanSummary({ plan, label }: { plan: DailyPlan; label: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Badge variant={plan.status === "reviewed" ? "success" : plan.status === "active" ? "warning" : "secondary"}>
          {plan.status}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {plan.focus_theme && (
          <span className="flex items-center gap-1 text-xs font-medium">
            <Target className="size-3 text-primary" /> {plan.focus_theme}
          </span>
        )}
        <span className="tabular text-[11px] text-muted-foreground">
          {plan.block_count} block(s) · {plan.planned_minutes}m
        </span>
      </div>
      {plan.summary && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{plan.summary}</p>}
    </div>
  );
}

function ReviewCard({ plan }: { plan: DailyPlan }) {
  const wins = Array.isArray(plan.wins) ? (plan.wins as string[]) : [];
  const misses = Array.isArray(plan.misses) ? (plan.misses as string[]) : [];
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Today&apos;s Review
        </span>
        <span
          className={cn(
            "tabular text-sm font-bold",
            (plan.completion_rate ?? 0) >= 70 ? "text-success" : (plan.completion_rate ?? 0) >= 40 ? "text-warning" : "text-danger",
          )}
        >
          {plan.completion_rate ?? 0}%
        </span>
      </div>
      {plan.review_notes && <p className="mb-2 text-xs leading-relaxed">{plan.review_notes}</p>}
      {wins.length > 0 && (
        <div className="mb-1 space-y-0.5">
          {wins.slice(0, 3).map((w, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="size-3 shrink-0 text-success" />
              <span className="truncate">{w}</span>
            </div>
          ))}
        </div>
      )}
      {misses.length > 0 && (
        <div className="space-y-0.5">
          {misses.slice(0, 3).map((m, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <XCircle className="size-3 shrink-0 text-danger" />
              <span className="truncate">{m}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DailyPlannerPanel({ state }: { state: PlannerPanelState }) {
  const [result, formAction, pending] = useActionState(runPlannerPhase, null);
  const { today, tomorrow } = state;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="AI Daily Planner" />
        <p className="mb-3 text-xs text-muted-foreground">
          Your Chief of Staff plans, adapts and reviews your day — deterministically, from your live priorities.
        </p>

        <form action={formAction} className="mb-3 grid grid-cols-2 gap-2">
          {PHASES.map(({ phase, label, icon: Icon, hint }) => (
            <button
              key={phase}
              type="submit"
              name="phase"
              value={phase}
              disabled={pending}
              title={hint}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-left text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
            >
              <Icon className="size-3.5 shrink-0 text-primary" />
              <span className="min-w-0 truncate">{label}</span>
            </button>
          ))}
        </form>

        {result && (
          <div
            className={cn(
              "mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
              result.ok ? "bg-primary/5 text-foreground" : "bg-destructive/10 text-destructive",
            )}
          >
            <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
            <span className="leading-relaxed">{result.ok ? result.message : result.error}</span>
          </div>
        )}

        <div className="space-y-2">
          {today?.status === "reviewed" ? (
            <ReviewCard plan={today} />
          ) : today ? (
            <PlanSummary plan={today} label="Today" />
          ) : (
            <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
              No plan for today yet. Tap <span className="font-medium text-foreground">Plan today</span> to generate one.
            </p>
          )}
          {tomorrow && <PlanSummary plan={tomorrow} label="Tomorrow (draft)" />}
        </div>
      </div>
    </Section>
  );
}
