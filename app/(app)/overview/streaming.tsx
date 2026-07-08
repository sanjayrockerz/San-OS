import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Brain, Sparkles, Target, Wallet, Zap } from "lucide-react";
import type { ElementType } from "react";
import type { Services } from "@/lib/services";
import type {
  BattlePlanStep,
  DailyCoachBrief,
  RecoveryPlan,
  StudentAction,
  RiskRegister,
  Mission,
  GoalSummary,
  ExecutionMetrics,
} from "@/lib/services";
import type { Tables } from "@/types/database";
import { TodaysMissionWrapper } from "@/components/dashboard/todays-mission-wrapper";
import { DailyPlannerPanel, type PlannerPanelState } from "@/components/dashboard/daily-planner-panel";
import { ExecutionPlanPanel } from "@/components/dashboard/execution-plan-panel";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { PerformanceEnginePanel } from "@/components/dashboard/performance-engine-panel";
import { GoalProgressPanel } from "@/components/dashboard/goal-progress-panel";
import { Disclosure } from "@/components/ui/disclosure";

/* ─── Helpers ─────────────────────────────────────────────────────── */

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const EMPTY_COACH_BRIEF: DailyCoachBrief = {
  greeting: greeting(),
  yesterday: { completed: 0, missed: 0, learningWins: 0 },
  today: {
    biggestOpportunity: null,
    insight: null,
    biggestRisk: null,
    recommendedPlan: [],
    estimatedMinutes: 0,
  },
  confidence: null,
};

const EMPTY_RECOVERY: RecoveryPlan = { totalMissed: 0, totalMinutes: 0, blocks: [] };

/* ─── Skeleton ─────────────────────────────────────────────────────── */

export function SectionSkeleton() {
  return (
    <div className="surface-card rounded-[1.75rem] p-6 space-y-4 overflow-hidden bg-card/90">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );
}

/* ─── GreetingShell — no data fetch needed ────────────────────────── */

export async function GreetingShell({ name }: { name: string }) {
  return (
    <div className="mb-8 w-full max-w-4xl mx-auto">
      <div className="surface-card relative overflow-hidden rounded-[2rem] border-border/60 bg-[radial-gradient(circle_at_top_right,rgba(124,125,255,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)] p-6 md:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.04),transparent)] opacity-70" />
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Zap className="size-3.5 text-primary" />
              Mission Control
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              Live
              <ArrowUpRight className="size-3.5" />
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
              {greeting()}, {name}.
            </h1>
            <p className="max-w-2xl text-sm md:text-base leading-6 text-muted-foreground">
              Your workspace is streaming the day in one calm surface. Priorities, planner, finance, and execution data appear as they’re ready.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniPill label="Command" value="⌘ K" />
            <MiniPill label="Planner" value="Preview first" />
            <MiniPill label="Finance" value="Type naturally" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            Press <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">⌘ K</kbd> to delegate tasks instantly.
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function formatRupees(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.max(0, Math.round(value))}%`;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ElementType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-border/60 bg-card/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
        </div>
        <div className={`rounded-2xl ${tone} p-2.5`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function SignalRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm text-foreground/90">{sub}</p>
      </div>
      <p className="text-right text-lg font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
    </div>
  );
}

/* ─── TodayMissionSection — coach brief + priorities + hero + stats ─ */

export async function TodayMissionSection({
  userId,
  services,
}: {
  userId: string;
  services: Services;
}) {
  const [coachBrief, intelligence, snapshot, financeSnapshot, gpaProjection, placementReadiness, recoveryPlan, executionMetrics] =
    await Promise.all([
      services.studentCoach.dailyBrief(userId, "none").catch(() => EMPTY_COACH_BRIEF),
      services.studentIntelligence.snapshot(userId).catch(() => ({
        continueLearning: [],
        recommendations: [],
        dailyPlan: [],
        priorities: [] as StudentAction[],
        risks: { overallRiskScore: 0, entries: [] } as RiskRegister,
        missions: [] as Mission[],
        battlePlan: [] as BattlePlanStep[],
      })),
      services.dashboardAggregation.snapshot(userId).catch(() => null),
      services.finance.snapshot(userId).catch(() => null),
      services.gpaProjection.projection(userId).catch(() => null),
      services.placementReadiness.readiness(userId).catch(() => null),
      services.studentCoach.recoveryPlan(userId).catch(() => EMPTY_RECOVERY),
      services.executionEngine.getTodayMetrics(userId).catch(
        () =>
          ({
            plannedMinutes: 0,
            actualMinutes: 0,
            deepWorkMinutes: 0,
            completedBlocks: 0,
            totalBlocks: 0,
            completionRate: 0,
            scheduleAccuracy: 0,
            focusSessions: 0,
            avgFocusScore: 0,
            longestStreak: 0,
          }) as ExecutionMetrics,
      ),
    ]);

  const priorities = intelligence.priorities;
  const hero = snapshot?.hero ?? {
    totalProblems: 0,
    uniqueSolved: 0,
    solvedThisWeek: 0,
    weeklyTarget: 21,
    revisionDue: 0,
    streak: 0,
  };
  const coachWarning = coachBrief.today.insight ?? "Let's focus on today's priorities.";
  const completionRate = hero.weeklyTarget > 0 ? (hero.solvedThisWeek / hero.weeklyTarget) * 100 : 0;
  const readinessScore =
    placementReadiness != null &&
    placementReadiness.targetCgpa != null &&
    placementReadiness.projectedGraduationCgpa != null
      ? Math.min(
          100,
          Math.round((placementReadiness.projectedGraduationCgpa / placementReadiness.targetCgpa) * 100),
        )
      : null;
  const backlogLabel =
    recoveryPlan.totalMissed > 0
      ? `${recoveryPlan.totalMissed} missed block${recoveryPlan.totalMissed === 1 ? "" : "s"}`
      : "No backlog";
  const priorityCount = Math.min(3, priorities.length);

  return (
    <>
      <div className="mx-auto mb-8 w-full max-w-6xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={Target}
            label="Execution"
            value={formatPercent(completionRate)}
            sub={`${hero.solvedThisWeek}/${hero.weeklyTarget} solved this week · ${hero.streak} day streak`}
            tone="bg-primary/10 text-primary"
          />
          <KpiCard
            icon={Brain}
            label="Deep Work"
            value={`${executionMetrics.deepWorkMinutes}m`}
            sub={`${executionMetrics.focusSessions} sessions · ${executionMetrics.completionRate}% completion`}
            tone="bg-sky-500/10 text-sky-600"
          />
          <KpiCard
            icon={Wallet}
            label="Revenue"
            value={formatRupees(financeSnapshot?.monthRevenue ?? null)}
            sub={`${formatRupees(financeSnapshot?.monthProfit ?? null)} profit this month`}
            tone="bg-emerald-500/10 text-emerald-600"
          />
          <KpiCard
            icon={Sparkles}
            label="Readiness"
            value={readinessScore != null ? `${readinessScore}%` : "—"}
            sub={
              gpaProjection?.projectedGpa != null
                ? `Projected CGPA ${gpaProjection.projectedGpa.toFixed(2)}`
                : "CGPA projection not ready"
            }
            tone="bg-amber-500/10 text-amber-600"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Today&apos;s Priorities</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">What matters first</h2>
              </div>
              <div className="rounded-full border border-border/60 bg-muted/70 px-3 py-1 text-xs text-muted-foreground">
                {priorityCount} {priorityCount === 1 ? "priority" : "priorities"}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {(priorities || []).slice(0, 3).map((p, i) => (
                <div
                  key={p.id}
                  className="flex gap-4 rounded-[1.4rem] border border-border/60 bg-background/70 px-4 py-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{p.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ~{p.estimatedMinutes} min ·{" "}
                      {p.kind.includes("project") || p.kind.includes("invoice")
                        ? "Deadline tomorrow"
                        : p.kind.includes("problem") || p.kind.includes("concept")
                          ? "Placement readiness focus"
                          : "Priority task"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {recoveryPlan.totalMissed > 0 && (
              <div className="mt-5 rounded-[1.4rem] border border-amber-500/20 bg-amber-500/8 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-amber-600">Recovery</p>
                <p className="mt-2 text-sm text-foreground/90">{coachWarning}</p>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Signals</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Live readout</h2>
              </div>
              <Sparkles className="size-5 text-primary" />
            </div>

            <div className="mt-6 space-y-3">
              <SignalRow
                label="Coach note"
                value="Calm pace"
                sub={coachBrief.today.insight ?? "Focus on the smallest important task first."}
              />
              <SignalRow
                label="Revenue"
                value={formatRupees(financeSnapshot?.monthRevenue ?? null)}
                sub={`${backlogLabel} · ${formatRupees(financeSnapshot?.monthProfit ?? null)} profit`}
              />
              <SignalRow
                label="CGPA"
                value={gpaProjection?.projectedGpa != null ? gpaProjection.projectedGpa.toFixed(2) : "—"}
                sub={
                  placementReadiness?.targetCgpa != null
                    ? `Target ${placementReadiness.targetCgpa.toFixed(2)}`
                    : "Target not available"
                }
              />
              <SignalRow
                label="Readiness"
                value={readinessScore != null ? `${readinessScore}%` : "—"}
                sub={
                  placementReadiness?.gap != null
                    ? `Gap ${placementReadiness.gap.toFixed(2)} from target`
                    : "No gap data yet"
                }
              />
            </div>

            <div className="mt-5 rounded-[1.4rem] bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(16,185,129,0.08))] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Executive note</p>
              <p className="mt-2 text-sm leading-6 text-foreground/90">
                {coachBrief.today.biggestOpportunity?.title ??
                  coachBrief.today.insight ??
                  "The day looks balanced. Keep the surface light, finish one key outcome, and let the rest stay queued."}
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          A lighter surface, clearer priorities, and fewer surprises.
        </p>
      </div>

      {/* TodaysMission */}
      <TodaysMissionWrapper brief={coachBrief} priorities={priorities || []} />
    </>
  );
}

/* ─── PlannerSection — planner state + today blocks ───────────────── */

export async function PlannerSection({
  userId,
  services,
}: {
  userId: string;
  services: Services;
}) {
  const [plannerState, todayBlocks] = await Promise.all([
    services.dailyPlanner
      .getPlannerState(userId)
      .catch(
        () =>
          ({ today: null, todayBlocks: [], tomorrow: null, recent: [] }) as PlannerPanelState,
      ),
    services.executionEngine.getTodayBlocks(userId).catch(() => [] as Tables<"time_blocks">[]),
  ]);

  return (
    <>
      <DailyPlannerPanel state={plannerState} />
      {todayBlocks.length > 0 && <ExecutionPlanPanel blocks={todayBlocks} />}
    </>
  );
}

/* ─── ExecutionSection — execution metrics ────────────────────────── */

export async function ExecutionSection({
  userId,
  services,
}: {
  userId: string;
  services: Services;
}) {
  const [executionMetrics, snapshot] = await Promise.all([
    services.executionEngine.getTodayMetrics(userId).catch(
      () =>
        ({
          plannedMinutes: 0,
          actualMinutes: 0,
          deepWorkMinutes: 0,
          completedBlocks: 0,
          totalBlocks: 0,
          completionRate: 0,
          scheduleAccuracy: 0,
          focusSessions: 0,
          avgFocusScore: 0,
          longestStreak: 0,
        }) as ExecutionMetrics,
    ),
    services.dashboardAggregation.snapshot(userId).catch(() => null),
  ]);

  const streak = snapshot?.hero?.streak ?? 0;

  return <PerformanceEnginePanel metrics={executionMetrics} streak={streak} />;
}

/* ─── CoachAndAnalyticsSection — insights + finance + goals ───────── */

export async function CoachAndAnalyticsSection({
  userId,
  services,
}: {
  userId: string;
  services: Services;
}) {
  const [coachBrief, intelligence, goalSummaries] = await Promise.all([
    services.studentCoach.dailyBrief(userId, "none").catch(() => EMPTY_COACH_BRIEF),
    services.studentIntelligence.snapshot(userId).catch(
      () =>
        ({
          continueLearning: [],
          recommendations: [],
          dailyPlan: [],
          priorities: [] as StudentAction[],
          risks: { overallRiskScore: 0, entries: [] } as RiskRegister,
          missions: [] as Mission[],
          battlePlan: [] as BattlePlanStep[],
        }),
    ),
    services.goalService.getActiveSummary(userId).catch(() => [] as GoalSummary[]),
  ]);

  return (
    <Disclosure
      defaultOpen={false}
      trigger={
        <span className="text-sm font-medium">View Coach Brief & Analytics</span>
      }
      triggerClassName="w-full mt-12 surface-card border-none bg-accent/50 hover:bg-accent text-accent-foreground rounded-2xl px-6 py-4 flex justify-center items-center gap-2 transition-colors"
    >
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightsPanel brief={coachBrief} risks={intelligence.risks} />
        <div className="space-y-6">
          <GoalProgressPanel summaries={goalSummaries} />
        </div>
      </div>
    </Disclosure>
  );
}
