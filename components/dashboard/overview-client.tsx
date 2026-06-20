"use client";

import Link from "next/link";
import {
  Plus,
  Play,
  Check,
  ArrowRight,
  Flame,
  RefreshCw,
  Network,
  Library,
  Inbox,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/charts/progress-ring";
import { DailyReflectionModal } from "@/components/dashboard/daily-reflection-modal";
import { DailySessionPanel } from "./daily-session-panel";
import { RecommendationsPanel } from "./recommendations-panel";
import { DailyDigestPanel } from "./daily-digest-panel";
import { NotificationCenterPanel } from "./notification-center-panel";
import { FocusModeSwitcher } from "./focus-mode-switcher";
import { EveningReviewPanel } from "./evening-review-panel";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { MissionControlPanel } from "./mission-control-panel";
import type {
  BattlePlanStep,
  EveningReview,
  Mission,
  MissedWorkItem,
  RiskRegister,
  StudentAction,
} from "@/lib/services";
import type { Tables } from "@/types/database";
import { CATEGORY_TINT, CATEGORY_TEXT } from "@/lib/design/category";
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
  risks: RiskRegister;
  missions: Mission[];
}

/** Next round-number milestone above `count` (next multiple of 50, or 100 once past 200). */
function nextMilestone(count: number): number {
  const step = count >= 200 ? 100 : 50;
  return Math.ceil((count + 1) / step) * step;
}

export function OverviewClient({ data }: { data: OverviewData }) {
  const openAddEntry = useUIStore((s) => s.setAddEntryOpen);
  const { hero } = data;
  const { solvedToday } = data;

  const weeklyPct = hero.weeklyTarget
    ? Math.min(100, Math.round((hero.solvedThisWeek / hero.weeklyTarget) * 100))
    : 0;
  const readiness = hero.totalProblems
    ? Math.min(99, Math.round((hero.uniqueSolved / hero.totalProblems) * 100))
    : 0;
  const milestone = nextMilestone(hero.uniqueSolved);
  const toMilestone = milestone - hero.uniqueSolved;

  return (
    <PageTransition>
      <DailyReflectionModal solvedToday={solvedToday} threshold={3} />

      {/* ===================================================================
          LEVEL 1 — MISSION: greeting/streak/readiness fused with the
          Battle Plan. The single largest, most spacious surface on the page.
          =================================================================== */}
      <Section className="mb-6">
        <div className="surface-card rounded-2xl border-category-mission/25 p-6 shadow-md sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-caption text-muted-foreground">{data.greeting}</p>
              <h1 className="text-display mt-1">{data.name}.</h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-body text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="size-4 text-danger" />
                  <span className="font-semibold text-foreground">
                    {hero.streak} day{hero.streak === 1 ? "" : "s"}
                  </span>{" "}
                  streak
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-success" />
                  <span className="font-semibold text-foreground">{readiness}%</span>{" "}
                  placement readiness
                </span>
                {data.estimatedMinutes > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className={cn("size-4", CATEGORY_TEXT.mission)} />
                    <span className="font-semibold text-foreground">
                      {data.estimatedMinutes}m
                    </span>{" "}
                    estimated today
                  </span>
                )}
              </p>
              {data.aiSummary && (
                <p className="mt-3 max-w-xl text-body leading-relaxed text-muted-foreground border-l-2 border-category-mission/40 pl-3">
                  {data.aiSummary}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FocusModeSwitcher initialMode={data.focusMode} />
              <Button onClick={() => openAddEntry(true)}>
                <Plus className="size-4" /> Add Learning Entry
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/revision">
                  <Play className="size-4" /> Start Revision
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ===================================================================
          LEVEL 2 — MISSION CONTROL: Today's Mission + Top Priorities + Risk
          Center, the StudentIntelligenceCore outputs surfaced as one
          coherent "what do I do right now and why" panel.
          =================================================================== */}
      <MissionControlPanel
        missions={data.missions}
        priorities={data.priorities}
        risks={data.risks}
        memoryHealth={data.memoryHealth}
        forgettingForecast={data.forgettingForecast}
        missedWork={data.missedWork}
        upcomingAssignments={data.upcomingAssignments}
      />

      {/* ===================================================================
          LEVEL 3 — RECOMMENDED ACTION: "do this next" lists, visually
          subordinate to Level 1/2.
          =================================================================== */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <NotificationCenterPanel items={data.notifications} />
          <DailySessionPanel items={data.dailyPlan} />
          <ResumePriorityCards
            items={data.resumeItems}
            becauseText={
              data.recentSolved[0]
                ? `Because you recently solved "${data.recentSolved[0].title}"`
                : data.activity[0]
                  ? `Because you recently: ${data.activity[0].text}`
                  : null
            }
          />
        </div>
        <div className="space-y-4">
          <RecommendationsPanel items={data.recommendations} />
          <RevisionQueue items={data.revisionQueue} due={hero.revisionDue} />
        </div>
      </div>

      {/* ===================================================================
          LEVEL 4 — PROGRESS: "how am I doing" — smaller visual weight.
          =================================================================== */}
      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <WeeklyRing pct={weeklyPct} solved={hero.solvedThisWeek} target={hero.weeklyTarget} />
        <DailyDigestPanel data={data.dailyDigest} milestone={milestone} toMilestone={toMilestone} />
        {data.eveningReview && <EveningReviewPanel review={data.eveningReview} />}
        <TaxonomyWaiting count={data.taxonomyProposalsCount} />
      </div>

      {/* ===================================================================
          LEVEL 5 — HISTORY: dense, compact, intentional-lookup territory.
          =================================================================== */}
      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
        <ActivityTimeline items={data.activity} />
        <RecentSolved items={data.recentSolved} />
        <RecentConcepts items={data.recentConcepts} />
        <RecentKnowledge items={data.recentKnowledge} />
      </div>
    </PageTransition>
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
