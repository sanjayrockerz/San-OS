import type { DashboardData } from "./dashboard-data-fetcher";
import { WIDGET_CONFIG, MISSION_CONTROL_ORDER } from "@/lib/mission-control/dashboard-widgets";
import type { DashboardWidget } from "@/lib/mission-control/dashboard-widgets";

export function getDevDashboardData(): DashboardData {
  const kpis: Record<string, any> = {
    readiness: {
      value: "89%",
      subtitle: "CGPA 7.8 — Top 8%",
      trend: 2,
      sparklineData: [82, 84, 83, 85, 87, 86, 89],
      progress: 89,
      insight: "Next milestone: Finish Graphs.",
    },
    focus: {
      value: "120m",
      subtitle: "4 sessions today",
      trend: 8,
      sparklineData: [25, 40, 35, 55, 45, 60, 52],
      progress: 72,
      insight: "Your focus on Graphs this week is paying off. Cenexa Authentication is the next milestone.",
    },
    streak: {
      value: "12 days",
      subtitle: "Keep going!",
      trend: 1,
      sparklineData: [1, 2, 3, 5, 7, 10, 12],
      progress: 40,
      insight: "12-day streak. Consistency builds momentum.",
    },
    projects: {
      value: "3",
      subtitle: "active projects",
      trend: 0,
      sparklineData: [2, 2, 3, 3, 4, 3, 3],
      progress: 60,
    },
    finance: {
      value: "₹45,000",
      subtitle: "₹12,500 profit",
      trend: 8,
      sparklineData: [12000, 15000, 18000, 22000, 25000, 28000, 32000],
      progress: 28,
    },
    academic: {
      value: "7.8",
      subtitle: "Projected CGPA",
      trend: 1,
      sparklineData: [6.8, 7.0, 7.1, 7.3, 7.5, 7.6, 7.8],
      progress: 78,
      insight: "2 pending actions",
    },
    dsa: {
      value: "57%",
      subtitle: "12/21 weekly target",
      trend: 3,
      sparklineData: [15, 28, 35, 42, 50, 58, 65],
      progress: 57,
    },
    business: {
      value: "1",
      subtitle: "pending actions",
      trend: 0,
      sparklineData: undefined,
      progress: 20,
    },
    health: {
      value: "4",
      subtitle: "focus sessions today",
      trend: 2,
      sparklineData: [1, 2, 2, 3, 3, 4, 5],
      progress: 25,
    },
    knowledge: {
      value: "2",
      subtitle: "Coverage: 72%",
      sparklineData: [10, 15, 22, 28, 35, 40, 48],
      progress: 72,
    },
    planner: {
      value: "8 blocks",
      subtitle: "240 min planned",
      sparklineData: [2, 4, 3, 5, 6, 4, 5],
      progress: 75,
    },
  };

  const sortedWidgets = MISSION_CONTROL_ORDER
    .map((id) => WIDGET_CONFIG.find((w) => w.id === id))
    .filter((w): w is DashboardWidget => w != null);

  return {
    yesterdayCompleted: 6,
    topPriorityTitle: "Complete Cenexa Authentication",
    coachInsight: "Yesterday you completed 6 tasks. Today's first win is finishing Cenexa Authentication.",
    estimatedMinutes: 180,
    priorityCount: 3,
    widgets: sortedWidgets,
    kpis,
  };
}