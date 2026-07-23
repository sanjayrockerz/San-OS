import type { Services } from "@/lib/services";
import type { DashboardWidget } from "@/lib/mission-control/dashboard-widgets";
import { WIDGET_CONFIG, MISSION_CONTROL_ORDER } from "@/lib/mission-control/dashboard-widgets";

export interface KpiSnapshot {
  id: string;
  value: string;
  subtitle: string;
  trend?: number;
  sparklineData?: number[];
  progress?: number;
  insight?: string;
}

export interface DashboardData {
  yesterdayCompleted: number;
  topPriorityTitle?: string;
  coachInsight?: string;
  estimatedMinutes: number;
  priorityCount: number;
  widgets: DashboardWidget[];
  kpis: Record<string, KpiSnapshot>;
  planner: {
    currentTitle: string | null;
    currentWindow: string | null;
    nextTitle: string | null;
    completionRate: number;
    totalBlocks: number;
  };
}

export interface CriticalDashboardData {
  yesterdayCompleted: number;
  topPriorityTitle?: string;
  coachInsight?: string;
  estimatedMinutes: number;
  priorityCount: number;
  planner: DashboardData["planner"];
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.max(0, Math.round(value))}%`;
}

function formatRupees(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number = 2500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function getDashboardData(
  userId: string,
  services: Services,
): Promise<DashboardData> {
  const [
    coachBrief,
    intelligence,
    aggregateSnapshot,
    financeSnapshot,
    placementReadiness,
    gpaProjection,
    executionMetrics,
    projects,
    academicActions,
    businessActions,
    knowledgeHealthSnapshot,
    plannerState,
  ] = await Promise.all([
    withTimeout(services.studentCoach.dailyBrief(userId, "none").catch(() => null), null),
    withTimeout(services.studentIntelligence.snapshot(userId).catch(() => null), null),
    withTimeout(services.dashboardAggregation.snapshot(userId).catch(() => null), null),
    withTimeout(services.finance.snapshot(userId).catch(() => null), null),
    withTimeout(services.placementReadiness.readiness(userId).catch(() => null), null),
    withTimeout(services.gpaProjection.projection(userId).catch(() => null), null),
    withTimeout(services.executionEngine.getTodayMetrics(userId).catch(() => null), null),
    withTimeout(services.project.listForUser(userId).catch(() => []), []),
    withTimeout(services.academicCoach.actions(userId).catch(() => []), []),
    withTimeout(services.businessCoach.actions(userId).catch(() => []), []),
    withTimeout(services.knowledgeHealth.snapshot(userId).catch(() => null), null),
    withTimeout(services.dailyPlanner.getPlannerState(userId).catch(() => null), null),
  ]);

  const priorities = intelligence?.priorities ?? [];
  const topPriorityTitle = priorities[0]?.title;
  const priorityCount = Math.min(3, priorities.length);
  const hero = aggregateSnapshot?.hero;
  const streak = hero?.streak ?? 0;
  const completionRate =
    hero?.weeklyTarget && hero.weeklyTarget > 0
      ? Math.round((hero.solvedThisWeek / hero.weeklyTarget) * 100)
      : 0;
  const readinessScore =
    placementReadiness?.targetCgpa != null &&
    placementReadiness?.projectedGraduationCgpa != null
      ? Math.min(
          100,
          Math.round(
            (placementReadiness.projectedGraduationCgpa / placementReadiness.targetCgpa) * 100,
          ),
        )
      : null;
  const deepWorkMinutes = executionMetrics?.deepWorkMinutes ?? 0;
  const focusSessions = executionMetrics?.focusSessions ?? 0;
  const monthRevenue = financeSnapshot?.monthRevenue ?? 0;
  const monthProfit = financeSnapshot?.monthProfit ?? 0;
  const projectedGpa = gpaProjection?.projectedGpa;
  const activeProjectCount = projects.filter(
    (p) => p.status === "active" || p.status === "planning",
  ).length;
  const knowledgeConceptsCount = knowledgeHealthSnapshot?.entities?.length ?? 0;
  const overallCoverage = knowledgeHealthSnapshot?.overallCoveragePercent ?? 0;
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const activeBlock = plannerState?.todayBlocks.find((block) => {
    const [startHour, startMinute] = block.start_time.split(":").map(Number);
    const [endHour, endMinute] = block.end_time.split(":").map(Number);
    return nowMinutes >= startHour * 60 + startMinute && nowMinutes < endHour * 60 + endMinute;
  });
  const nextBlock = plannerState?.todayBlocks
    .filter((block) => block.status === "planned")
    .find((block) => {
      const [hour, minute] = block.start_time.split(":").map(Number);
      return hour * 60 + minute >= nowMinutes;
    });

  const kpis: Record<string, KpiSnapshot> = {
    readiness: {
      id: "readiness",
      value: readinessScore != null ? `${readinessScore}%` : "—",
      subtitle:
        readinessScore != null
          ? projectedGpa
            ? `CGPA ${projectedGpa.toFixed(2)}`
            : "Placement readiness"
          : "No data yet",
      trend: readinessScore != null && readinessScore > 50 ? 2 : undefined,
      sparklineData: [82, 84, 83, 85, 87, 86, 89],
      progress: readinessScore ?? 0,
      insight: readinessScore != null ? "Next milestone: Finish Graphs." : undefined,
    },
    focus: {
      id: "focus",
      value: `${deepWorkMinutes}m`,
      subtitle: `${focusSessions} sessions today`,
      trend: focusSessions > 0 ? 8 : 0,
      sparklineData: [25, 40, 35, 55, 45, 60, deepWorkMinutes],
      progress: Math.min(100, Math.round((deepWorkMinutes / 120) * 100)),
      insight: coachBrief?.today?.insight ?? "Focus on the smallest important task first.",
    },
    streak: {
      id: "streak",
      value: `${streak} day${streak === 1 ? "" : "s"}`,
      subtitle: "Keep going!",
      trend: streak > 0 ? 1 : 0,
      sparklineData: [1, 2, 3, 5, 7, 10, streak],
      progress: Math.min(100, Math.round((streak / 30) * 100)),
      insight: streak > 0
        ? `${streak}-day streak. Consistency builds momentum.`
        : "Start your streak today.",
    },
    projects: {
      id: "projects",
      value: `${activeProjectCount}`,
      subtitle: "active projects",
      trend: activeProjectCount > 0 ? 0 : undefined,
      sparklineData: [2, 2, 3, 3, 4, 3, activeProjectCount],
      progress: Math.min(100, activeProjectCount * 25),
    },
    finance: {
      id: "finance",
      value: formatRupees(monthRevenue),
      subtitle: `${formatRupees(monthProfit)} profit`,
      trend: monthProfit > 0 ? 8 : undefined,
      sparklineData: [12000, 15000, 18000, 22000, 25000, 28000, monthRevenue],
      progress: Math.min(100, monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0),
    },
    academic: {
      id: "academic",
      value: projectedGpa != null ? projectedGpa.toFixed(2) : "—",
      subtitle: projectedGpa != null ? "Projected CGPA" : "Academic performance",
      trend: projectedGpa != null && projectedGpa >= 8 ? 1 : undefined,
      sparklineData: [6.8, 7.0, 7.1, 7.3, 7.5, 7.6, projectedGpa ?? 0],
      progress: projectedGpa != null ? Math.min(100, Math.round((projectedGpa / 10) * 100)) : 0,
      insight: academicActions.length > 0 ? `${academicActions.length} pending actions` : undefined,
    },
    dsa: {
      id: "dsa",
      value: completionRate > 0 ? `${completionRate}%` : "—",
      subtitle: `${hero?.solvedThisWeek ?? 0}/${hero?.weeklyTarget ?? 21} weekly`,
      trend: completionRate > 50 ? 3 : undefined,
      sparklineData: [15, 28, 35, 42, 50, 58, completionRate],
      progress: completionRate,
    },
    business: {
      id: "business",
      value: businessActions.length > 0 ? `${businessActions.length}` : "—",
      subtitle: "pending actions",
      sparklineData: undefined,
      progress: Math.min(100, businessActions.length * 20),
    },
    health: {
      id: "health",
      value: `${focusSessions}`,
      subtitle: "focus sessions today",
      trend: focusSessions > 3 ? 2 : undefined,
      sparklineData: [1, 2, 2, 3, 3, 4, focusSessions],
      progress: Math.min(100, focusSessions * 16),
    },
    knowledge: {
      id: "knowledge",
      value: knowledgeConceptsCount > 0 ? `${knowledgeConceptsCount}` : "—",
      subtitle: overallCoverage > 0 ? `Coverage: ${Math.round(overallCoverage)}%` : "concepts",
      sparklineData: [10, 15, 22, 28, 35, 40, knowledgeConceptsCount],
      progress: overallCoverage,
    },
    planner: {
      id: "planner",
      value: `${executionMetrics?.totalBlocks ?? 0} blocks`,
      subtitle: `${executionMetrics?.plannedMinutes ?? 0} min planned`,
      sparklineData: [2, 4, 3, 5, 6, 4, executionMetrics?.totalBlocks ?? 0],
      progress: executionMetrics?.completionRate ?? 0,
    },
  };

  const sortedWidgets = MISSION_CONTROL_ORDER
    .map((id) => WIDGET_CONFIG.find((w) => w.id === id))
    .filter((w): w is DashboardWidget => w != null);

  return {
    yesterdayCompleted: coachBrief?.yesterday?.completed ?? 0,
    topPriorityTitle,
    coachInsight: coachBrief?.today?.insight ?? undefined,
    estimatedMinutes: coachBrief?.today?.estimatedMinutes ?? 0,
    priorityCount,
    widgets: sortedWidgets,
    kpis,
    planner: {
      currentTitle: activeBlock?.title ?? null,
      currentWindow: activeBlock ? `${activeBlock.start_time.slice(0, 5)}–${activeBlock.end_time.slice(0, 5)}` : null,
      nextTitle: nextBlock?.title ?? null,
      completionRate: executionMetrics?.completionRate ?? 0,
      totalBlocks: executionMetrics?.totalBlocks ?? 0,
    },
  };
}

const dataPromiseCache = new Map<string, Promise<DashboardData>>();
const criticalPromiseCache = new Map<string, Promise<CriticalDashboardData>>();

/** Small first-paint payload. Heavy domain snapshots stay behind the streamed
 * mission surface and KPI sections. */
export function getCriticalDashboardData(
  userId: string,
  services: Services,
): Promise<CriticalDashboardData> {
  const key = `critical-${userId}`;
  if (!criticalPromiseCache.has(key)) {
    criticalPromiseCache.set(key, Promise.all([
      withTimeout(services.studentCoach.dailyBrief(userId, "none").catch(() => null), null, 2000),
      withTimeout(services.studentIntelligence.snapshot(userId).catch(() => null), null, 2000),
      withTimeout(services.executionEngine.getTodayMetrics(userId).catch(() => null), null, 2000),
      withTimeout(services.dailyPlanner.getPlannerState(userId).catch(() => null), null, 2000),
    ]).then(([coachBrief, intelligence, executionMetrics, plannerState]) => {
      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      const activeBlock = plannerState?.todayBlocks.find((block) => {
        const [sh, sm] = block.start_time.split(":").map(Number);
        const [eh, em] = block.end_time.split(":").map(Number);
        return nowMinutes >= sh * 60 + sm && nowMinutes < eh * 60 + em;
      });
      const nextBlock = plannerState?.todayBlocks.find((block) => {
        const [h, m] = block.start_time.split(":").map(Number);
        return h * 60 + m >= nowMinutes && block.status === "planned";
      });
      return {
        yesterdayCompleted: coachBrief?.yesterday?.completed ?? 0,
        topPriorityTitle: intelligence?.priorities?.[0]?.title,
        coachInsight: coachBrief?.today?.insight ?? undefined,
        estimatedMinutes: coachBrief?.today?.estimatedMinutes ?? 0,
        priorityCount: Math.min(3, intelligence?.priorities?.length ?? 0),
        planner: {
          currentTitle: activeBlock?.title ?? null,
          currentWindow: activeBlock ? `${activeBlock.start_time.slice(0, 5)}–${activeBlock.end_time.slice(0, 5)}` : null,
          nextTitle: nextBlock?.title ?? null,
          completionRate: executionMetrics?.completionRate ?? 0,
          totalBlocks: executionMetrics?.totalBlocks ?? 0,
        },
      };
    }));
    setTimeout(() => criticalPromiseCache.delete(key), 15000);
  }
  return criticalPromiseCache.get(key)!;
}

export function getCachedDashboardData(
  userId: string,
  services: Services,
): Promise<DashboardData> {
  const key = `dash-${userId}`;
  if (!dataPromiseCache.has(key)) {
    dataPromiseCache.set(key, getDashboardData(userId, services));
    setTimeout(() => dataPromiseCache.delete(key), 60000);
  }
  return dataPromiseCache.get(key)!;
}
