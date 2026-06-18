"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Play,
  Check,
  Circle,
  Loader2,
  ArrowRight,
  Flame,
  RefreshCw,
  Dumbbell,
  GraduationCap,
  BookOpen,
  Network,
  Library,
  Inbox,
  CalendarCheck,
  AlertTriangle,
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
import { MissedWorkPanel } from "./missed-work-panel";
import { FocusModeSwitcher } from "./focus-mode-switcher";
import { EveningReviewPanel } from "./evening-review-panel";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { completeBattlePlanTask } from "@/app/(app)/overview/actions";
import type { BattlePlanStep, EveningReview, MissedWorkItem } from "@/lib/services";
import type { Tables } from "@/types/database";

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
}

const KIND_META: Record<
  BattlePlanStep["kind"],
  { icon: typeof RefreshCw; tint: string }
> = {
  revise: { icon: RefreshCw, tint: "#60a5fa" },
  strengthen: { icon: Dumbbell, tint: "#fbbf24" },
  learn: { icon: BookOpen, tint: "#34d399" },
  academic: { icon: GraduationCap, tint: "#a78bfa" },
};

const DIFFICULTY_VARIANT = {
  easy: "success",
  medium: "warning",
  hard: "danger",
} as const;

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

  return (
    <PageTransition>
      <DailyReflectionModal solvedToday={solvedToday} threshold={3} />
      {/* Hero */}
      <Section className="mb-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {data.greeting}
            </p>
            <h1 className="mt-1 text-[28px] font-bold tracking-tight sm:text-[34px]">
              {data.name}.
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
                  <Sparkles className="size-4 text-primary" />
                  <span className="font-semibold text-foreground">
                    {data.estimatedMinutes}m
                  </span>{" "}
                  estimated today
                </span>
              )}
            </p>
            {data.aiSummary && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground border-l-2 border-primary/40 pl-3">
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
      </Section>

      <DailyDigestPanel data={data.dailyDigest} />

      <div className="mt-4">
        <MissedWorkPanel items={data.missedWork} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mt-4">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          <NotificationCenterPanel items={data.notifications} />
          <DailySessionPanel items={data.dailyPlan} />
          <ResumePriorityCards items={data.resumeItems} />
          <RecommendationsPanel items={data.recommendations} />
          <RevisionQueue items={data.revisionQueue} due={hero.revisionDue} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <WeeklyRing
            pct={weeklyPct}
            solved={hero.solvedThisWeek}
            target={hero.weeklyTarget}
          />
          {data.eveningReview && <EveningReviewPanel review={data.eveningReview} />}
          <MemoryHealthPanel
            memoryHealth={data.memoryHealth}
            forgettingForecast={data.forgettingForecast}
          />
          <TaxonomyWaiting count={data.taxonomyProposalsCount} />
          <IitReminders items={data.upcomingAssignments} />
          <RecentKnowledge items={data.recentKnowledge} />
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActivityTimeline items={data.activity} />
        <RecentSolved items={data.recentSolved} />
        <RecentConcepts items={data.recentConcepts} />
      </div>
    </PageTransition>
  );
}

/* -------------------------------------------------------------------------- */
/* Resume Priority                                                              */
/* -------------------------------------------------------------------------- */

const RESUME_META: Record<
  OverviewData["resumeItems"][0]["type"],
  { icon: React.ElementType; tint: string }
> = {
  revision: { icon: RefreshCw, tint: "#60a5fa" }, // blue-400
  concept: { icon: Sparkles, tint: "#34d399" }, // emerald-400
  vault: { icon: Library, tint: "#fbbf24" }, // amber-400
  problem: { icon: Dumbbell, tint: "hsl(var(--primary))" },
  iit: { icon: GraduationCap, tint: "#a78bfa" }, // violet-400
};

function ResumePriorityCards({
  items,
}: {
  items: OverviewData["resumeItems"];
}) {
  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="Continue Learning" />
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Sparkles className="size-6 text-primary/70" />
            <p className="mt-2 text-sm font-medium">You&apos;re all caught up! ✨</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No active sessions or drafts found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.slice(0, 4).map((item) => {
              const meta = RESUME_META[item.type];
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
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${meta.tint}22`, color: meta.tint }}
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

/* -------------------------------------------------------------------------- */
/* Revision Queue                                                              */
/* -------------------------------------------------------------------------- */

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
          title="Revision Queue"
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
                +{due - items.length} more due
              </p>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Right column widgets                                                         */
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
      <div className="surface-card flex items-center gap-4 rounded-2xl p-5">
        <ProgressRing value={pct} size={92} stroke={9}>
          <span className="text-lg font-bold tabular">{solved}</span>
          <span className="text-[10px] text-muted-foreground">/ {target}</span>
        </ProgressRing>
        <div>
          <p className="text-sm font-semibold">Weekly Goal</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.max(0, target - solved)} solves left to hit your target.
          </p>
        </div>
      </div>
    </Section>
  );
}

function MemoryHealthPanel({
  memoryHealth,
  forgettingForecast,
}: {
  memoryHealth: OverviewData["memoryHealth"];
  forgettingForecast: OverviewData["forgettingForecast"];
}) {
  const nothingTracked =
    memoryHealth.atRisk.length === 0 &&
    memoryHealth.neglected.length === 0 &&
    forgettingForecast.likelyForgotten.length === 0;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <ProgressRing value={memoryHealth.overallScore} size={64} stroke={7}>
            <span className="text-sm font-bold tabular">
              {memoryHealth.overallScore}
            </span>
          </ProgressRing>
          <div>
            <p className="text-sm font-semibold">Memory Health</p>
            <p className="text-xs text-muted-foreground">
              Recall strength across everything you&apos;ve solved.
            </p>
          </div>
        </div>

        {nothingTracked ? (
          <p className="mt-4 py-2 text-center text-xs text-muted-foreground">
            Solve and revise a few problems to start tracking recall.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {forgettingForecast.likelyForgotten.slice(0, 3).map((item) => (
              <Link
                key={item.problemId}
                href={`/problems/${item.problemId}`}
                className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 p-2.5 transition-colors hover:bg-danger/10"
              >
                <AlertTriangle className="size-3.5 shrink-0 text-danger" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {item.title}
                </span>
                <span className="shrink-0 text-xs font-semibold text-danger">
                  {item.score}%
                </span>
              </Link>
            ))}
            {memoryHealth.atRisk.slice(0, 2).map((topic) => (
              <div
                key={topic.id}
                className="flex items-center gap-2 rounded-xl border border-border p-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {topic.name}
                </span>
                <Badge variant="warning">at risk</Badge>
              </div>
            ))}
            {memoryHealth.neglected.slice(0, 2).map((topic) => (
              <div
                key={topic.id}
                className="flex items-center gap-2 rounded-xl border border-border p-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {topic.name}
                </span>
                <Badge variant="default">neglected</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

function TaxonomyWaiting({ count }: { count: number }) {
  return (
    <Section>
      <Link
        href="/taxonomy"
        className="surface-card group flex items-center gap-3 rounded-2xl p-5 transition-colors hover:bg-accent"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Network className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Taxonomy Proposals</p>
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

function IitReminders({
  items,
}: {
  items: OverviewData["upcomingAssignments"];
}) {
  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading title="IIT Reminders" />
        {items.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No upcoming assignments.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
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
                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                  {d.title}
                </p>
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
        )}
      </div>
    </Section>
  );
}

function RecentKnowledge({
  items,
}: {
  items: OverviewData["recentKnowledge"];
}) {
  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
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
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Library className="size-6 text-muted-foreground/50" />
            <p className="mt-2 text-xs text-muted-foreground">
              Nothing saved yet.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((k) => (
              <Link
                key={k.id}
                href="/vault"
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{k.title}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
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

/* -------------------------------------------------------------------------- */
/* Bottom row                                                                   */
/* -------------------------------------------------------------------------- */

function ActivityTimeline({ items }: { items: OverviewData["activity"] }) {
  return (
    <Section>
      <div className="surface-card flex h-full flex-col rounded-2xl p-5">
        <SectionHeading title="Activity" />
        {items.length > 0 ? (
          <div className="space-y-4 pl-1">
            {items.map((a, i) => {
              const body = (
                <>
                  <div className="flex flex-col items-center">
                    <span className="size-2.5 rounded-full bg-primary ring-4 ring-card" />
                    {i < items.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="-mt-0.5 pb-1">
                    <p className="text-sm">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground">{a.time}</p>
                  </div>
                </>
              );
              return a.href ? (
                <Link key={a.id} href={a.href} className="flex gap-3 hover:opacity-80">
                  {body}
                </Link>
              ) : (
                <div key={a.id} className="flex gap-3">
                  {body}
                </div>
              );
            })}
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
  );
}

function RecentSolved({ items }: { items: OverviewData["recentSolved"] }) {
  return (
    <Section>
      <div className="surface-card h-full rounded-2xl p-5">
        <SectionHeading title="Recently Solved" />
        {items.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No solved problems yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {items.map((p) => (
              <Link
                key={p.problemId}
                href={`/problems/${p.problemId}`}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
              >
                <Check className="size-4 shrink-0 text-success" />
                <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
                {p.difficulty && (
                  <Badge variant={DIFFICULTY_VARIANT[p.difficulty]}>
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
      <div className="surface-card h-full rounded-2xl p-5">
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
          <div className="space-y-1.5">
            {items.map((c) => (
              <Link
                key={c.id}
                href={`/concepts/${c.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
              >
                <Sparkles className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm">{c.title}</span>
                <Badge variant="secondary">{c.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
