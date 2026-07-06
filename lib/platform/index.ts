import type { Repositories } from "@/lib/repositories";
import { EventBus } from "@/lib/event-bus";
import { WorkflowEngine } from "@/lib/workflow";
import { LifeIntelligenceEngine, createSignalProviders } from "@/lib/intelligence";
import { ContextManager } from "@/lib/context";
import { RuleEngine, BUILT_IN_RULES } from "@/lib/rules";
import { AutomationEngine } from "@/lib/automation";
import { PredictionEngine } from "@/lib/prediction";
import { BackgroundJobQueue, createBackgroundJobHandlers } from "@/lib/background";
import { CacheManager } from "@/lib/cache";
import { PermissionGuard } from "@/lib/security";
import { createAutomationTasks } from "./automation-tasks";
import { createWorkflows } from "./workflows";

export interface CorePlatform {
  eventBus: EventBus;
  workflowEngine: WorkflowEngine;
  intelligenceEngine: LifeIntelligenceEngine;
  contextManager: ContextManager;
  ruleEngine: RuleEngine;
  automationEngine: AutomationEngine;
  predictionEngine: PredictionEngine;
  jobQueue: BackgroundJobQueue;
  cacheManager: CacheManager;
  permissionGuard: PermissionGuard;
}

let platformInstance: CorePlatform | null = null;

export function initializePlatform(repos: Repositories): CorePlatform {
  if (platformInstance) return platformInstance;

  const eventBus = new EventBus(repos);
  const workflowEngine = new WorkflowEngine(repos, eventBus);
  const intelligenceEngine = new LifeIntelligenceEngine(repos, eventBus);
  const contextManager = new ContextManager(repos, eventBus);
  const ruleEngine = new RuleEngine();
  const automationEngine = new AutomationEngine(repos, eventBus);
  const predictionEngine = new PredictionEngine();
  const jobQueue = new BackgroundJobQueue(eventBus, 4);
  const cacheManager = new CacheManager({ namespace: "platform", ttlMs: 30_000 });
  const permissionGuard = new PermissionGuard();

  intelligenceEngine.registerProviders(createSignalProviders(repos));

  ruleEngine.registerRules(BUILT_IN_RULES);
  registerRuleActionHandlers(ruleEngine, eventBus);

  const workflows = createWorkflows(eventBus, repos);
  for (const workflow of workflows) {
    workflowEngine.register(workflow);
  }

  const automationTasks = createAutomationTasks(repos, eventBus, contextManager, intelligenceEngine);
  for (const task of automationTasks) {
    automationEngine.register(task);
  }

  const jobHandlers = createBackgroundJobHandlers(repos);
  for (const handler of jobHandlers) {
    jobQueue.register(handler);
  }

  platformInstance = {
    eventBus,
    workflowEngine,
    intelligenceEngine,
    contextManager,
    ruleEngine,
    automationEngine,
    predictionEngine,
    jobQueue,
    cacheManager,
    permissionGuard,
  };

  jobQueue.start();
  automationEngine.start();

  return platformInstance;
}

export function getPlatform(): CorePlatform {
  if (!platformInstance) {
    throw new Error("Platform not initialized. Call initializePlatform(repos) first.");
  }
  return platformInstance;
}

export function getEventBus(): EventBus {
  return getPlatform().eventBus;
}

export function getWorkflowEngine(): WorkflowEngine {
  return getPlatform().workflowEngine;
}

export function getIntelligenceEngine(): LifeIntelligenceEngine {
  return getPlatform().intelligenceEngine;
}

export function getContextManager(): ContextManager {
  return getPlatform().contextManager;
}

export function getRuleEngine(): RuleEngine {
  return getPlatform().ruleEngine;
}

export function getAutomationEngine(): AutomationEngine {
  return getPlatform().automationEngine;
}

export function getPredictionEngine(): PredictionEngine {
  return getPlatform().predictionEngine;
}

export function getJobQueue(): BackgroundJobQueue {
  return getPlatform().jobQueue;
}

export function getCacheManager(): CacheManager {
  return getPlatform().cacheManager;
}

export function getPermissionGuard(): PermissionGuard {
  return getPlatform().permissionGuard;
}

function registerRuleActionHandlers(ruleEngine: RuleEngine, eventBus: EventBus): void {
  const actionTypes = [
    "coach_warning", "increase_priority", "create_reminder", "add_timeline_event",
    "coach_recommendation", "adjust_planner", "health_warning", "reduce_workload",
    "suggest_break", "academic_warning", "increase_study_hours", "reduce_readiness",
    "create_catchup_session", "goal_review_reminder",
  ];
  for (const type of actionTypes) {
    ruleEngine.registerActionHandler(type, async (action, ctx) => {
      await eventBus.emit(ctx.userId, `rule.${type}`, action.params);
    });
  }
}
