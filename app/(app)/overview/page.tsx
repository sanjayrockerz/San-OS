import { requireContext } from "@/lib/server/context";
import {
  OverviewClient,
  type OverviewData,
} from "@/components/dashboard/overview-client";
import type { BattlePlanStep, EveningReview, MissedWorkItem } from "@/lib/services";
import { HabitEngineService } from "@/lib/services";
import type { SessionTask } from "@/lib/services/context-engine.service";
import type { Tables } from "@/types/database";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

/** Whether an assignment due-date falls within the next three days. */
function isDueSoon(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
}

/** Deep link + rough duration for a derived battle-plan step. */
function battlePlanLink(step: BattlePlanStep): { href: string; minutes: number } {
  switch (step.kind) {
    case "revise":
      return { href: "/revision", minutes: 8 };
    case "strengthen":
      return {
        href: step.entityId ? `/problems/${step.entityId}` : "/problems",
        minutes: 15,
      };
    case "learn":
      return {
        href: step.entityId ? `/concepts/${step.entityId}` : "/concepts",
        minutes: 10,
      };
    case "academic":
      return { href: "/iit-workspace", minutes: 20 };
    default:
      return { href: "/overview", minutes: 10 };
  }
}

/**
 * Overview dashboard — the morning landing surface. Reads ONLY the
 * DashboardAggregationService snapshot (no direct domain queries, no analytics
 * logic in the page); each section is fail-soft inside the service.
 */
export default async function OverviewPage() {
  const { user, services } = await requireContext("/overview");

  const today = new Date().toISOString().slice(0, 10);

  // Habit Engine evaluation must run before the notification/missed-work
  // reads below so due items are materialised into `notifications` first.
  await services.habitEngine.evaluateForUser(user.id).catch(() => ({
    generated: 0,
    expired: 0,
    missed: 0,
    unreadCount: 0,
  }));

  const [
    profile,
    snapshot,
    aiInsights,
    todayLog,
    resumeItems,
    recommendations,
    dailyDigest,
    dailyPlan,
    preferences,
    notifications,
    missedWork,
  ] = await Promise.all([
    services.repos.profile.findByUserId(user.id).catch(() => null),
    services.dashboardAggregation.snapshot(user.id),
    services.repos.aiInsights.active(user.id).catch(() => [] as never[]),
    services.repos.dailyLogs.findByDate(user.id, today).catch(() => null),
    services.context.resumePriority(user.id).catch(() => []),
    services.context.recommendations(user.id).catch(() => []),
    services.context.dailyDigest(user.id).catch(() => ({
      problemsSolved: 0,
      revisionsCompleted: 0,
      conceptsCreated: 0,
      knowledgeAdded: 0,
      iitCompleted: 0,
      streak: 0,
      observation: null,
    })),
    services.context.buildDailyPlan(user.id).catch(() => []),
    services.repos.userPreferences
      .findByUser(user.id)
      .catch(() => null as Tables<"user_preferences"> | null),
    services.habitEngine
      .getNotificationCenter(user.id)
      .catch(() => [] as Tables<"notifications">[]),
    services.habitEngine.getMissedWorkQueue(user.id).catch(() => [] as MissedWorkItem[]),
  ]);

  const isEvening = new Date().getHours() >= 18;
  const eveningReviewEnabled = preferences?.evening_review_enabled ?? true;
  const eveningReview: EveningReview | null =
    isEvening && eveningReviewEnabled
      ? await services.habitEngine.getEveningReview(user.id).catch(() => null)
      : null;

  const name =
    profile?.display_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  const focusMode = preferences?.default_focus_mode ?? "none";
  const focusConfig = HabitEngineService.getFocusModeConfig(focusMode);
  const visibleBattlePlan = focusConfig.hideBattlePlanKinds?.length
    ? snapshot.battlePlan.filter(
        (step) => !focusConfig.hideBattlePlanKinds!.includes(step.kind),
      )
    : snapshot.battlePlan;

  const estimatedMinutes = visibleBattlePlan.reduce((sum, step) => {
    const mins = step.kind === "revise" ? 8 : step.kind === "strengthen" ? 15 : step.kind === "academic" ? 20 : 10;
    return sum + mins;
  }, 0);

  const topInsight = (aiInsights as { detail?: string | null }[])[0];
  const aiSummary = topInsight?.detail ?? null;

  const data: OverviewData = {
    name,
    greeting: greeting(),
    estimatedMinutes,
    aiSummary,
    hero: snapshot.hero,
    battlePlan: visibleBattlePlan.map((step, i) => {
      const { href, minutes } = battlePlanLink(step);
      return {
        id: `${step.kind}-${step.entityId ?? i}`,
        kind: step.kind,
        title: step.title,
        detail: step.detail,
        href,
        minutes,
        entityId: step.entityId ?? null,
      };
    }),
    resumeItems: resumeItems.map((r) => ({
      ...r,
      lastTouchedAt: r.lastTouchedAt ? relativeTime(r.lastTouchedAt) : null,
    })),
    recommendations,
    dailyDigest,
    dailyPlan,
    continueLearning: snapshot.continueLearning[0]
      ? {
          problemId: snapshot.continueLearning[0].problemId,
          title: snapshot.continueLearning[0].title,
          lastTouched: relativeTime(snapshot.continueLearning[0].lastTouchedAt),
        }
      : null,
    revisionQueue: snapshot.revisionQueue.slice(0, 5).map((r) => ({
      problemId: r.problemId,
      title: r.title,
      state: r.state,
    })),
    upcomingAssignments: snapshot.upcomingAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      due: a.dueDate
        ? new Date(a.dueDate).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          })
        : "No date",
      urgent: isDueSoon(a.dueDate),
    })),
    taxonomyProposalsCount: snapshot.taxonomyProposalsCount,
    recentKnowledge: snapshot.recentKnowledge.map((k) => ({
      id: k.id,
      type: k.type,
      title: k.title,
      time: relativeTime(k.createdAt),
    })),
    activity: snapshot.activityTimeline.slice(0, 6).map((item) => ({
      id: item.id,
      text: item.text,
      href: item.href,
      time: relativeTime(item.at),
    })),
    recentSolved: snapshot.recentSolved.map((s) => ({
      problemId: s.problemId,
      title: s.title,
      difficulty: s.difficulty,
    })),
    recentConcepts: snapshot.recentConcepts.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
    })),
    memoryHealth: {
      overallScore: snapshot.memoryHealth.overallScore,
      atRisk: snapshot.memoryHealth.atRisk.map((t) => ({
        id: t.entityId,
        name: t.name,
        healthScore: t.healthScore,
      })),
      neglected: snapshot.memoryHealth.neglected.map((t) => ({
        id: t.entityId,
        name: t.name,
      })),
    },
    forgettingForecast: {
      likelyForgotten: snapshot.forgettingForecast.likelyForgotten.map((f) => ({
        problemId: f.problemId,
        title: f.title,
        score: f.score,
      })),
      atRiskCount: snapshot.forgettingForecast.atRisk.length,
    },
    solvedToday: todayLog?.problems_solved ?? 0,
    notifications,
    missedWork,
    focusMode,
    eveningReview,
  };

  return <OverviewClient data={data} />;
}
