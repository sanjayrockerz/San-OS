import { getPlatform } from ".";
import { logger } from "@/lib/observability";
import { tracer } from "@/lib/observability";
import { metrics } from "@/lib/observability";

export interface PlatformHealthReport {
  eventBus: { emitted: number; handled: number; failed: number; subscriptions: number };
  workflowEngine: { registered: number; activeExecutions: number };
  intelligenceEngine: { providers: number; cacheEntries: number };
  contextManager: { cacheEntries: number };
  ruleEngine: { rules: number };
  automationEngine: { tasks: number; running: boolean };
  predictionEngine: { models: number };
  jobQueue: { queued: number; running: number; completed: number; failed: number };
  cacheManager: { size: number; hitRate: number };
  observability: { logCount: number; traceCount: number; metricSeries: number };
}

export function getHealthReport(): PlatformHealthReport {
  const platform = getPlatform();
  const cacheStats = platform.cacheManager.stats();
  const busStats = platform.eventBus.getStats();

  return {
    eventBus: {
      emitted: busStats.totalEmitted,
      handled: busStats.totalHandled,
      failed: busStats.totalFailed,
      subscriptions: busStats.activeSubscriptions,
    },
    workflowEngine: {
      registered: platform.workflowEngine.listDefinitions().length,
      activeExecutions: platform.workflowEngine.getActiveExecutions(),
    },
    intelligenceEngine: {
      providers: 0,
      cacheEntries: 0,
    },
    contextManager: {
      cacheEntries: 0,
    },
    ruleEngine: {
      rules: platform.ruleEngine.getRules().length,
    },
    automationEngine: {
      tasks: platform.automationEngine.getTasks().length,
      running: platform.automationEngine.isRunning(),
    },
    predictionEngine: {
      models: platform.predictionEngine.getModels().length,
    },
    jobQueue: platform.jobQueue.getStats(),
    cacheManager: {
      size: cacheStats.size,
      hitRate: cacheStats.hitRate,
    },
    observability: {
      logCount: logger.getLogs().length,
      traceCount: tracer.getRecentTraces(1000).length,
      metricSeries: metrics.getAllSeries().length,
    },
  };
}

export function getSlowOperationsReport(thresholdMs = 500) {
  return logger.getSlowOperations(thresholdMs);
}

export function getTraceReport(limit = 20) {
  return tracer.getRecentTraces(limit).map((t) => ({
    id: t.id,
    name: t.name,
    duration: t.duration,
    spanCount: t.spans.length,
    startTime: new Date(t.startTime).toISOString(),
  }));
}
