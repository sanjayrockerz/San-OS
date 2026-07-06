import { CacheManager } from "@/lib/cache";
import { EventBus } from "@/lib/event-bus";
import { WorkflowEngine } from "@/lib/workflow";
import { RuleEngine } from "@/lib/rules";
import { BackgroundJobQueue } from "@/lib/background";
import { ContextManager } from "@/lib/context";
import { AutomationEngine } from "@/lib/automation";
import { PredictionEngine } from "@/lib/prediction";
import { LifeIntelligenceEngine } from "@/lib/intelligence";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = (...args: any[]) => undefined;

function mockFn(): MockFn {
  const fn: MockFn = () => undefined;
  return fn;
}

export function createMockRepositories() {
  return {
    events: { create: mockFn(), recent: mockFn(), forEntity: mockFn() },
    revision: { findByUser: mockFn(), dueQueue: mockFn(), weakQueue: mockFn() },
    problems: { listVisible: mockFn(), findByUser: mockFn() },
    concepts: { findByUser: mockFn() },
    knowledge: { recent: mockFn(), findByUser: mockFn() },
    iitAssignments: { upcoming: mockFn(), findByUser: mockFn() },
    iitCourses: { findByUser: mockFn() },
    userContext: { findByUser: mockFn(), upsert: mockFn() },
    timeBlocks: { findByUser: mockFn() },
    focusSessions: { findByUser: mockFn() },
    userGoals: { findByUser: mockFn() },
    invoices: { findByUser: mockFn() },
    pipelineEntries: { findByUser: mockFn() },
    dailyLogs: { between: mockFn() },
    attempts: { findByUser: mockFn() },
    projects: { findByUser: mockFn() },
    academicGoals: { findByUser: mockFn() },
  };
}

export function createTestEventBus(): EventBus {
  const repos = createMockRepositories() as unknown as Record<string, unknown>;
  return new EventBus(repos as never);
}

export function createTestWorkflowEngine(): WorkflowEngine {
  const repos = createMockRepositories() as unknown as Record<string, unknown>;
  const eventBus = createTestEventBus();
  return new WorkflowEngine(repos as never, eventBus);
}

export function createTestRuleEngine(): RuleEngine {
  return new RuleEngine();
}

export function createTestJobQueue(): BackgroundJobQueue {
  const eventBus = createTestEventBus();
  return new BackgroundJobQueue(eventBus);
}

export function createTestContextManager(): ContextManager {
  const repos = createMockRepositories() as unknown as Record<string, unknown>;
  const eventBus = createTestEventBus();
  return new ContextManager(repos as never, eventBus);
}

export function createTestAutomationEngine(): AutomationEngine {
  const repos = createMockRepositories() as unknown as Record<string, unknown>;
  const eventBus = createTestEventBus();
  return new AutomationEngine(repos as never, eventBus);
}

export function createTestPredictionEngine(): PredictionEngine {
  return new PredictionEngine();
}

export function createTestIntelligenceEngine(): LifeIntelligenceEngine {
  const repos = createMockRepositories() as unknown as Record<string, unknown>;
  const eventBus = createTestEventBus();
  return new LifeIntelligenceEngine(repos as never, eventBus);
}

export function createTestCacheManager<T>(): CacheManager<T> {
  return new CacheManager<T>({ ttlMs: 1000, maxSize: 100 });
}
