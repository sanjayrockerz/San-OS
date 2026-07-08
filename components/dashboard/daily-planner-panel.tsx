"use client";

import { useActionState } from "react";
import {
  CalendarClock,
  Sunrise,
  RefreshCw,
  Moon,
  Sparkles,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { draftPlannerPhase, commitPlannerPhase, type PlannerPhase } from "@/app/(app)/execution/actions";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import type { DraftPlannerResult } from "@/lib/services/daily-planner.service";

type DailyPlan = Tables<"daily_plans">;
type DraftTask = DraftPlannerResult["scheduled"][number];

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
  const [draftResult, draftAction, drafting] = useActionState(draftPlannerPhase, null);
  const [commitResult, commitAction, committing] = useActionState(commitPlannerPhase, null);

  const { today, tomorrow } = state;
  const draftPlan = draftResult?.ok && "draft" in draftResult ? draftResult.draft : null;
  const draftMessage = draftResult?.ok && "message" in draftResult ? draftResult.message : null;
  const draftError = draftResult && !draftResult.ok ? draftResult.error : null;
  const commitError = commitResult && !commitResult.ok ? commitResult.error : null;
  const bannerMessage = commitResult?.ok ? commitResult.message : draftError || commitError || draftMessage;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="AI Daily Planner" />

        {draftPlan ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm font-medium leading-relaxed">
                {draftResult?.ok && "conversationalMessage" in draftResult ? draftResult.conversationalMessage : null}
              </p>
            </div>

            <form action={commitAction} className="space-y-4">
              <input type="hidden" name="draft" value={JSON.stringify(draftPlan)} />

              <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                {draftPlan.scheduled.map((task: DraftTask, i: number) => {
                  const formatTime = (mins: number) => {
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                  };

                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 text-sm sm:flex-row sm:items-center"
                    >
                      <div className="flex-1 truncate font-medium">{task.title}</div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="time"
                          name={`start_${i}`}
                          defaultValue={formatTime(task.startMinutes)}
                          className="rounded border border-border bg-muted/50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                          type="time"
                          name={`end_${i}`}
                          defaultValue={formatTime(task.endMinutes)}
                          className="rounded border border-border bg-muted/50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  );
                })}
                {draftPlan.unscheduledCount > 0 && (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    + {draftPlan.unscheduledCount} items didn&apos;t fit and were deferred.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={committing}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  {committing ? "Finalizing..." : "Confirm Schedule"}
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium transition-colors hover:bg-muted/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Your Chief of Staff plans from live intelligence plus anything you type here. Mention sequence, rough timing, and what matters most, then confirm the draft below.
            </p>

            <form action={draftAction} className="mb-3 space-y-2">
              <textarea
                name="context"
                placeholder="Example: I will do workout in the morning, eat breakfast, work on the Shawarma project, talk to my gf, then study PDS."
                className="min-h-[96px] w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-xs leading-5 placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                disabled={drafting}
              />
              <p className="text-[11px] text-muted-foreground">
                Use natural language. I will infer morning/evening hints, order, and likely duration, then ask you to confirm timings.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PHASES.map(({ phase, label, icon: Icon, hint }) => (
                  <button
                    key={phase}
                    type="submit"
                    name="phase"
                    value={phase}
                    disabled={drafting}
                    title={hint}
                    className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-left text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
                  >
                    <Icon className="size-3.5 shrink-0 text-primary" />
                    <span className="min-w-0 truncate">{label}</span>
                  </button>
                ))}
              </div>
            </form>

            {bannerMessage && (
              <div
                className={cn(
                  "mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
                  commitResult?.ok ? "bg-primary/5 text-foreground" : "bg-destructive/10 text-destructive",
                )}
              >
                <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
                <span className="leading-relaxed">
                  {bannerMessage}
                </span>
              </div>
            )}

            <div className="mt-4 space-y-2">
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
          </>
        )}
      </div>
    </Section>
  );
}
