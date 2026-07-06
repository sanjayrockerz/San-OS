"use client";

import Link from "next/link";
import {
  Check,
  ArrowRight,
  RefreshCw,
  Network,
  Library,
  Inbox,
  Sparkles,
  CalendarClock,
} from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Disclosure } from "@/components/ui/disclosure";
import { ProgressRing } from "@/components/charts/progress-ring";
import { DailyReflectionModal } from "@/components/dashboard/daily-reflection-modal";
import { MissionHero } from "./mission-hero";
import { TodaysMission } from "./todays-mission";
import { InsightsPanel } from "./insights-panel";
import { StatTiles } from "./stat-tiles";
import { ContextCalendarPanel } from "./context-calendar-panel";
import { FocusTimerWidget } from "./focus-timer-widget";
import { DailyQuote } from "./daily-quote";
import { DailySessionPanel } from "./daily-session-panel";
import { RecommendationsPanel } from "./recommendations-panel";
import { DailyDigestPanel } from "./daily-digest-panel";
import { NotificationCenterPanel } from "./notification-center-panel";
import { EveningReviewPanel } from "./evening-review-panel";
import { MissedWorkPanel } from "./missed-work-panel";
import { FinanceSnapshotWidget } from "./finance-snapshot-widget";
import { GoalProgressPanel } from "./goal-progress-panel";
import { QuickCaptureWidget } from "./quick-capture-widget";
import { ScratchpadWidget } from "./scratchpad-widget";
import { ExecutionPlanPanel } from "./execution-plan-panel";
import { PerformanceEnginePanel } from "./performance-engine-panel";
import { DailyPlannerPanel, type PlannerPanelState } from "./daily-planner-panel";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { MissionCenter, RiskAlerts } from "./mission-control-panel";
import type {
  BattlePlanStep,
  DailyCoachBrief,
  EveningReview,
  ExecutionMetrics,
  FinanceSnapshot,
  GoalSummary,
  Mission,
  MissedWorkItem,
  RecoveryPlan,
  RiskRegister,
  StudentAction,
} from "@/lib/services";
import type { Tables } from "@/types/database";
import { CATEGORY_TINT } from "@/lib/design/category";
import {
  DIFFICULTY_BADGE_VARIANT,
  RESUME_ITEM_META,
  type Difficulty,
} from "@/lib/design/status";

interface BattlePlanItem {
  id: string;
  kind: BattlePlanStep["kind"];
  title: string;
  detail: string;
  href: string;
  minutes: number;
  entityId: string | null;
}

export interface OverviewData {
  name: string;
  greeting: string;
  estimatedMinutes: number;
  aiSummary: string | null;
  hero: {
    totalProblems: number;
    uniqueSolved: number;
    solvedThisWeek: number;
    weeklyTarget: number;
    revisionDue: number;
    streak: number;
  };
  battlePlan: BattlePlanItem[];
  resumeItems: {
    type: "revision" | "concept" | "vault" | "problem" | "iit";
    priority: number;
    title: string;
    reason: string;
    href: string;
    estimatedMinutes: number;
    lastTouchedAt: string | null;
    entityId: string | null;
  }[];
  recommendations: {
    id: string;
    title: string;
    body: string;
    href: string | null;
    actionLabel: string;
    priority: number;
  }[];
  dailyDigest: {
    problemsSolved: number;
    revisionsCompleted: number;
    conceptsCreated: number;
    knowledgeAdded: number;
    iitCompleted: number;
    streak: number;
    observation: string | null;
  };
  dailyPlan: {
    id: string;
    type: "revision" | "concept" | "problem" | "iit" | "roadmap";
    title: string;
    estimatedMinutes: number;
    href: string;
  }[];
  continueLearning: {
    problemId: string;
    title: string;
    lastTouched: string;
  } | null;
  revisionQueue: { problemId: string; title: string; state: string }[];
  upcomingAssignments: {
    id: string;
    title: string;
    due: string;
    urgent: boolean;
  }[];
  taxonomyProposalsCount: number;
  recentKnowledge: { id: string; type: string; title: string; time: string }[];
  activity: { id: string; text: string; href: string | null; time: string }[];
  memoryHealth: {
    overallScore: number;
    atRisk: { id: string; name: string; healthScore: number }[];
    neglected: { id: string; name: string }[];
  };
  forgettingForecast: {
    likelyForgotten: { problemId: string; title: string; score: number }[];
    atRiskCount: number;
  };
  recentSolved: {
    problemId: string;
    title: string;
    difficulty: "easy" | "medium" | "hard" | null;
  }[];
  recentConcepts: { id: string; title: string; status: string }[];
  solvedToday: number;
  notifications: Tables<"notifications">[];
  missedWork: MissedWorkItem[];
  focusMode: string;
  eveningReview: EveningReview | null;
  priorities: StudentAction[];
  missions: Mission[];
  risks: RiskRegister;
  coachBrief: DailyCoachBrief;
  recoveryPlan: RecoveryPlan;
  todayBlocks: Tables<"time_blocks">[];
  goalSummaries: GoalSummary[];
  executionMetrics: ExecutionMetrics;
  financeSnapshot: FinanceSnapshot | null;
  plannerState: PlannerPanelState;
}

/** Next round-number milestone above `count` (next multiple of 50, or 100 once past 200). */
function nextMilestone(count: number): number {
  const step = count >= 200 ? 100 : 50;
  return Math.ceil((count + 1) / step) * step;
}

export function OverviewClient({ data }: { data: OverviewData }) {
  const openAddEntry = useUIStore((s) => s.setAddEntryOpen);
  const { hero, solvedToday } = data;

  return (
    <PageTransition>
      <DailyReflectionModal solvedToday={solvedToday} threshold={3} />

      <div className="flex flex-col h-full max-w-5xl mx-auto py-8 lg:py-12">
        {/* Top AI Command Bar Hint */}
        <div className="mb-12 text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {data.greeting}, {data.name}.
          </h1>
          <p className="text-lg text-muted-foreground">
            Press <kbd className="font-mono text-sm bg-muted px-2 py-1 rounded-md">⌘ K</kbd> to plan your day, log time, or ask a question.
          </p>
        </div>

        {/* Center Canvas: Daily Mission */}
        <div className="flex-1 space-y-8 max-w-3xl mx-auto w-full">
          <TodaysMission
            brief={data.coachBrief}
            priorities={data.priorities}
            onAddPriority={() => openAddEntry(true)}
          />

          <DailyPlannerPanel state={data.plannerState} />

          {data.todayBlocks.length > 0 && (
            <ExecutionPlanPanel blocks={data.todayBlocks} />
          )}

          {/* Progressive Disclosure Drawer / Accordion for Secondary Intel */}
          <Disclosure
            defaultOpen={false}
            trigger={<span className="text-sm font-medium">View Coach Brief & Analytics</span>}
            triggerClassName="w-full mt-12 surface-card border-none bg-accent/50 hover:bg-accent text-accent-foreground rounded-2xl px-6 py-4 flex justify-center items-center gap-2 transition-colors"
          >
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <InsightsPanel brief={data.coachBrief} risks={data.risks} />
              <div className="space-y-6">
                {data.executionMetrics.totalBlocks > 0 && (
                  <PerformanceEnginePanel metrics={data.executionMetrics} streak={data.hero.streak} />
                )}
                {data.financeSnapshot && <FinanceSnapshotWidget snapshot={data.financeSnapshot} />}
                <GoalProgressPanel summaries={data.goalSummaries} />
              </div>
            </div>
          </Disclosure>
        </div>
      </div>
    </PageTransition>
  );
}

/* -------------------------------------------------------------------------- */
/* Recovery — collapsed inside "Show more", not a hero-level distraction      */
/* -------------------------------------------------------------------------- */

const RECOVERY_LABEL_OVERRIDES: Record<string, string> = {
  learning: "DSA & Revision",
  academic: "Academic",
  project: "Projects",
  personal: "Personal",
  health: "Health",
  general: "General",
};

function RecoveryBlocks({ recovery }: { recovery: OverviewData["recoveryPlan"] }) {
  return (
    <Section>
      <div className="surface-card rounded-2xl border-warning/30 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4.5 text-warning" />
            <h2 className="text-section">Recovery Plan</h2>
          </div>
          <Badge variant="warning">~{recovery.totalMinutes} min total</Badge>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          You missed {recovery.totalMissed} item{recovery.totalMissed === 1 ? "" : "s"}. Here&apos;s an
          achievable way to catch up, broken into short blocks.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recovery.blocks.map((block) => (
            <div key={block.label} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{RECOVERY_LABEL_OVERRIDES[block.label] ?? block.label}</p>
                <span className="text-xs font-medium text-muted-foreground">{block.minutes} min</span>
              </div>
              <MissedWorkPanel items={block.items} bare />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Level 3 — Recommended Action                                                */
/* -------------------------------------------------------------------------- */

function ResumePriorityCards({
  items,
  becauseText,
}: {
  items: OverviewData["resumeItems"];
  becauseText?: string | null;
}) {
  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="Continue Learning" />
        {becauseText && (
          <p className="mb-3 text-xs text-muted-foreground">{becauseText}</p>
        )}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Sparkles className="size-6 text-primary/70" />
            <p className="mt-2 text-sm font-medium">You&apos;re all caught up!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No active sessions or drafts found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.slice(0, 4).map((item) => {
              const meta = RESUME_ITEM_META[item.type];
              const Icon = meta.icon;
              return (
                <Link
                  key={item.entityId ?? item.title}
                  href={item.href}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg",
                          CATEGORY_TINT[meta.category],
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.type}
                      </span>
                    </div>
                    {item.lastTouchedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.lastTouchedAt}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="line-clamp-1 font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">
                      {item.reason}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      ~{item.estimatedMinutes} min
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Resume <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}

function RevisionQueue({
  items,
  due,
}: {
  items: OverviewData["revisionQueue"];
  due: number;
}) {
  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading
          title="Memory at Risk"
          action={
            <Link
              href="/revision"
              className="text-xs font-medium text-primary hover:underline"
            >
              Open session
            </Link>
          }
        />
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nothing due today. You&apos;re caught up.
          </p>
        ) : (
          <div className="space-y-1.5">
            {items.map((r) => (
              <Link
                key={r.problemId}
                href={`/problems/${r.problemId}`}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent"
              >
                <RefreshCw className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {r.title}
                </span>
                <Badge variant="secondary">{r.state}</Badge>
              </Link>
            ))}
            {due > items.length && (
              <p className="pt-1 text-center text-xs text-muted-foreground">
                +{due - items.length} more slipping
              </p>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Level 4 — Progress                                                          */
/* -------------------------------------------------------------------------- */

function WeeklyRing({
  pct,
  solved,
  target,
}: {
  pct: number;
  solved: number;
  target: number;
}) {
  return (
    <Section>
      <div className="surface-card flex items-center gap-3 rounded-xl p-4">
        <ProgressRing value={pct} size={72} stroke={7}>
          <span className="text-sm font-bold tabular">{solved}</span>
          <span className="text-[10px] text-muted-foreground">/ {target}</span>
        </ProgressRing>
        <div>
          <p className="text-title">Weekly Goal</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.max(0, target - solved)} solves left to hit your target.
          </p>
        </div>
      </div>
    </Section>
  );
}

function TaxonomyWaiting({ count }: { count: number }) {
  return (
    <Section>
      <Link
        href="/taxonomy"
        className="surface-card group flex items-center gap-3 rounded-xl p-4 transition-colors hover:bg-accent"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Network className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-title">Taxonomy Proposals</p>
          <p className="text-xs text-muted-foreground">
            {count > 0
              ? `${count} suggestion${count === 1 ? "" : "s"} waiting for review`
              : "No proposals waiting"}
          </p>
        </div>
        {count > 0 && <Badge variant="default">{count}</Badge>}
        <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Level 5 — History                                                           */
/* -------------------------------------------------------------------------- */

function RecentKnowledge({
  items,
}: {
  items: OverviewData["recentKnowledge"];
}) {
  return (
    <Section>
      <div className="surface-card h-full rounded-xl p-4">
        <SectionHeading
          title="Recent Knowledge"
          action={
            <Link
              href="/vault"
              className="text-xs font-medium text-primary hover:underline"
            >
              Vault
            </Link>
          }
        />
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Library className="size-5 text-muted-foreground/50" />
            <p className="mt-2 text-xs text-muted-foreground">
              Nothing saved yet.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((k) => (
              <Link
                key={k.id}
                href="/vault"
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-accent"
              >
                <span className="min-w-0 flex-1 truncate text-xs">{k.title}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {k.time}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

function ActivityTimeline({ items }: { items: OverviewData["activity"] }) {
  return (
    <Section>
      <div className="surface-card flex h-full flex-col rounded-xl p-4">
        <SectionHeading title="Activity" />
        {items.length > 0 ? (
          <div className="space-y-3 pl-1">
            {items.map((a, i) => {
              const body = (
                <>
                  <div className="flex flex-col items-center">
                    <span className="size-2 rounded-full bg-primary ring-4 ring-card" />
                    {i < items.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="-mt-0.5 pb-1">
                    <p className="text-xs">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground">{a.time}</p>
                  </div>
                </>
              );
              return a.href ? (
                <Link key={a.id} href={a.href} className="flex gap-2.5 hover:opacity-80">
                  {body}
                </Link>
              ) : (
                <div key={a.id} className="flex gap-2.5">
                  {body}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
            <Inbox className="size-6 text-muted-foreground/50" />
            <p className="mt-2 text-xs font-medium">No activity yet</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Log a problem to see your timeline here.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}

function RecentSolved({ items }: { items: OverviewData["recentSolved"] }) {
  return (
    <Section>
      <div className="surface-card h-full rounded-xl p-4">
        <SectionHeading title="Recently Solved" />
        {items.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No solved problems yet.
          </p>
        ) : (
          <div className="space-y-1">
            {items.map((p) => (
              <Link
                key={p.problemId}
                href={`/problems/${p.problemId}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-accent"
              >
                <Check className="size-3.5 shrink-0 text-success" />
                <span className="min-w-0 flex-1 truncate text-xs">{p.title}</span>
                {p.difficulty && (
                  <Badge variant={DIFFICULTY_BADGE_VARIANT[p.difficulty as Difficulty]}>
                    {p.difficulty}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

function RecentConcepts({ items }: { items: OverviewData["recentConcepts"] }) {
  return (
    <Section>
      <div className="surface-card h-full rounded-xl p-4">
        <SectionHeading
          title="Recent Concepts"
          action={
            <Link
              href="/concepts"
              className="text-xs font-medium text-primary hover:underline"
            >
              All
            </Link>
          }
        />
        {items.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No concept notes yet.
          </p>
        ) : (
          <div className="space-y-1">
            {items.map((c) => (
              <Link
                key={c.id}
                href={`/concepts/${c.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-accent"
              >
                <Sparkles className="size-3.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-xs">{c.title}</span>
                <Badge variant="secondary">{c.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
