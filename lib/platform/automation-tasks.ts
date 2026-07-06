import type { Repositories } from "@/lib/repositories";
import { EventBus } from "@/lib/event-bus";
import { ContextManager } from "@/lib/context";
import { LifeIntelligenceEngine } from "@/lib/intelligence";
import { BUILT_IN_AUTOMATIONS, type AutomationTask } from "@/lib/automation";

export function createAutomationTasks(
  repos: Repositories,
  eventBus: EventBus,
  contextManager: ContextManager,
  intelligenceEngine: LifeIntelligenceEngine,
): AutomationTask[] {
  return [
    {
      ...BUILT_IN_AUTOMATIONS[0],
      execute: async (userId: string) => {
        await eventBus.emit(userId, "automation.nightly_plan", { userId });
        const today = new Date().toISOString().slice(0, 10);
        await eventBus.emit(userId, "planner.plan_generated", { date: today, userId });
      },
    },
    {
      ...BUILT_IN_AUTOMATIONS[1],
      execute: async (userId: string) => {
        const context = await contextManager.get(userId);
        const snapshot = await intelligenceEngine.analyze(userId);
        await eventBus.emit(userId, "automation.morning_brief", {
          userId,
          context: {
            activeProject: context.currentProject?.title,
            activeGoal: context.currentGoal?.title,
          },
          priorities: snapshot.rankedSignals.slice(0, 5),
        });
      },
    },
    {
      ...BUILT_IN_AUTOMATIONS[2],
      execute: async (userId: string) => {
        await eventBus.emit(userId, "automation.evening_review", { userId });
        const todayEvents = await repos.events.recent(userId, 50);
        const todayStart = new Date().toISOString().slice(0, 10);
        const todaysEvents = todayEvents.filter(
          (e) => e.created_at >= todayStart,
        );
        await eventBus.emit(userId, "timeline.day_summary", {
          eventCount: todaysEvents.length,
          date: todayStart,
        });
      },
    },
    {
      ...BUILT_IN_AUTOMATIONS[3],
      execute: async (userId: string) => {
        const snapshot = await intelligenceEngine.analyze(userId);
        await eventBus.emit(userId, "automation.weekly_review", {
          userId,
          recommendations: snapshot.recommendations,
          domainBreakdown: snapshot.domainBreakdown,
        });
      },
    },
    {
      ...BUILT_IN_AUTOMATIONS[4],
      execute: async (userId: string) => {
        const invoices = await repos.invoices.findByUser(userId);
        const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0);
        const totalPaid = invoices
          .filter((i) => i.status === "paid")
          .reduce((s, i) => s + (i.total_amount ?? 0), 0);
        await eventBus.emit(userId, "automation.monthly_finance", {
          userId,
          totalInvoiced,
          totalPaid,
          outstanding: totalInvoiced - totalPaid,
          period: new Date().toISOString().slice(0, 7),
        });
      },
    },
    {
      ...BUILT_IN_AUTOMATIONS[5],
      execute: async (userId: string) => {
        const snapshot = await intelligenceEngine.analyze(userId);
        const placementSignals = snapshot.rankedSignals.filter(
          (s) => s.domain === "placement" || s.domain === "learning",
        );
        await eventBus.emit(userId, "automation.quarterly_placement", {
          userId,
          readinessSignals: placementSignals,
          recommendations: snapshot.recommendations.filter(
            (r) => r.domain === "placement" || r.domain === "learning",
          ),
        });
      },
    },
  ];
}
