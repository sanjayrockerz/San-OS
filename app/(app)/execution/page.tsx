import { requireContext } from "@/lib/server/context";
import { ExecutionPageClient } from "./page-client";

export default async function ExecutionPage() {
  const { user, services } = await requireContext("/execution");

  const [todayBlocks, metrics, weeklyReport, captureItems, financeSnapshot, plannerState] = await Promise.all([
    services.executionEngine.getTodayBlocks(user.id).catch(() => []),
    services.executionEngine.getTodayMetrics(user.id).catch(() => ({
      plannedMinutes: 0, actualMinutes: 0, deepWorkMinutes: 0,
      completedBlocks: 0, totalBlocks: 0, completionRate: 0,
      scheduleAccuracy: 0, focusSessions: 0, avgFocusScore: 0, longestStreak: 0,
    })),
    services.executionEngine.getWeeklyExecutionReport(user.id).catch(() => ({
      weeklyMetrics: [], trend: "stable" as const, topInsight: "",
    })),
    services.repos.captureItems.findPending(user.id).catch(() => []),
    services.finance.snapshot(user.id).catch(() => ({
      monthRevenue: 0, monthExpenses: 0, monthProfit: 0,
      outstandingAr: 0, pipelineValue: 0, pipelineWeighted: 0,
    })),
    services.dailyPlanner.getPlannerState(user.id).catch(() => ({
      today: null, todayBlocks: [], tomorrow: null, recent: [],
    })),
  ]);

  return (
    <ExecutionPageClient
      todayBlocks={todayBlocks}
      metrics={metrics}
      weeklyReport={weeklyReport}
      captureItems={captureItems}
      financeSnapshot={financeSnapshot}
      plannerState={{ today: plannerState.today, tomorrow: plannerState.tomorrow, recent: plannerState.recent }}
    />
  );
}
