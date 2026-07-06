/**
 * Service layer barrel.
 *
 * Services orchestrate business logic and compose one or more repositories.
 * Server Actions call services; services call repositories; repositories call
 * the database. Each service is constructed with the full repository bundle so
 * cross-domain workflows live in one place.
 */
export * from "./base.service";
export * from "./event.service";
export * from "./timeline.service";
export * from "./activity.service";
export * from "./revision.service";
export * from "./problems.service";
export * from "./analytics.service";
export * from "./roadmaps.service";
export * from "./concepts.service";
export * from "./iit.service";
export * from "./ai.service";
export * from "./taxonomy.service";
export * from "./dashboard-aggregation.service";
export * from "./knowledge-graph.service";
export * from "./knowledge.service";
export * from "./context-engine.service";
export * from "./habit-engine.service";
export * from "./memory-intelligence.service";
export * from "./memory-health.service";
export * from "./memory-coach.service";
export * from "./knowledge-health.service";
export * from "./learning-gap-engine.service";
export * from "./resource-effectiveness.service";
export * from "./knowledge-coach.service";
export * from "./academic-health.service";
export * from "./gpa-projection.service";
export * from "./academic-performance.service";
export * from "./academic-simulator.service";
export * from "./placement-readiness.service";
export * from "./academic-coach.service";
export * from "./student-intelligence-core.service";
export * from "./student-coach.service";
export * from "./coach-outcome.service";
export * from "./project.service";
export * from "./project-coach.service";
export * from "./roadmap-coach.service";
export * from "./business-coach.service";
export * from "./quote-engine.service";
export * from "./client.service";
export * from "./pipeline.service";
export * from "./invoice.service";
export * from "./finance.service";
export * from "./execution-engine.service";
export * from "./completion-inference.service";
export * from "./execution-learning.service";
export * from "./execution-coach.service";
export * from "./alarm-engine.service";
export * from "./reminder-engine.service";
export * from "./goal.service";
export * from "./daily-planner.service";
export * from "./natural-language-planning.service";
export * from "./semantic-memory.service";
export * from "./resource.service";
export * from "./memory-graph.service";
export * from "./resource-pipeline.service";
export * from "./universal-search.service";
export * from "./universal-intake.service";

import { createRepositories, type DbClient } from "@/lib/repositories";
import { initializePlatform } from "@/lib/platform";
import { EventBus } from "@/lib/event-bus";
import { WorkflowEngine } from "@/lib/workflow";
import { LifeIntelligenceEngine } from "@/lib/intelligence";
import { ContextManager } from "@/lib/context";
import { RuleEngine } from "@/lib/rules";
import { AutomationEngine } from "@/lib/automation";
import { PredictionEngine } from "@/lib/prediction";
import { BackgroundJobQueue } from "@/lib/background";
import { CacheManager } from "@/lib/cache";
import { PermissionGuard } from "@/lib/security";

import { AcademicCoachService } from "./academic-coach.service";
import { AcademicHealthService } from "./academic-health.service";
import { ActivityService } from "./activity.service";
import { AiService } from "./ai.service";
import { AnalyticsService } from "./analytics.service";
import { ConceptService } from "./concepts.service";
import { ContextEngineService } from "./context-engine.service";
import { DashboardAggregationService } from "./dashboard-aggregation.service";
import { EventService } from "./event.service";
import { GpaProjectionService } from "./gpa-projection.service";
import { AcademicPerformanceService } from "./academic-performance.service";
import { AcademicSimulatorService } from "./academic-simulator.service";
import { PlacementReadinessService } from "./placement-readiness.service";
import { HabitEngineService } from "./habit-engine.service";
import { KnowledgeGraphService } from "./knowledge-graph.service";
import { KnowledgeService } from "./knowledge.service";
import { IitService } from "./iit.service";
import { KnowledgeCoachService } from "./knowledge-coach.service";
import { KnowledgeHealthService } from "./knowledge-health.service";
import { LearningGapEngine } from "./learning-gap-engine.service";
import { MemoryIntelligenceService } from "./memory-intelligence.service";
import { MemoryCoachService } from "./memory-coach.service";
import { MemoryHealthService } from "./memory-health.service";
import { ProblemsService } from "./problems.service";
import { ResourceEffectivenessService } from "./resource-effectiveness.service";
import { RevisionService } from "./revision.service";
import { RoadmapService } from "./roadmaps.service";
import { StudentIntelligenceCoreService } from "./student-intelligence-core.service";
import { StudentCoachService } from "./student-coach.service";
import { CoachOutcomeService } from "./coach-outcome.service";
import { TaxonomyService } from "./taxonomy.service";
import { TimelineService } from "./timeline.service";
import { ProjectService } from "./project.service";
import { ProjectCoachService } from "./project-coach.service";
import { RoadmapCoachService } from "./roadmap-coach.service";
import { BusinessCoachService } from "./business-coach.service";
import { QuoteEngineService } from "./quote-engine.service";
import { ClientService } from "./client.service";
import { PipelineService } from "./pipeline.service";
import { InvoiceService } from "./invoice.service";
import { FinanceService } from "./finance.service";
import { ExecutionEngineService } from "./execution-engine.service";
import { CompletionInferenceService } from "./completion-inference.service";
import { ExecutionLearningService } from "./execution-learning.service";
import { ExecutionCoachService } from "./execution-coach.service";
import { AlarmEngineService } from "./alarm-engine.service";
import { ReminderEngineService } from "./reminder-engine.service";
import { GoalService } from "./goal.service";
import { DailyPlannerService } from "./daily-planner.service";
import { NaturalLanguagePlanningService } from "./natural-language-planning.service";
import { SemanticMemoryService } from "./semantic-memory.service";
import { ResourceService } from "./resource.service";
import { MemoryGraphService } from "./memory-graph.service";
import { ResourcePipelineService } from "./resource-pipeline.service";
import { UniversalSearchService } from "./universal-search.service";
import { UniversalIntakeService } from "./universal-intake.service";

/**
 * Constructs every domain service bound to a single Supabase client. A request
 * handler (Server Action / Route Handler) calls this once with the appropriate
 * client and gets the whole service surface.
 */
export function createServices(client: DbClient) {
  const repos = createRepositories(client);
  const platform = initializePlatform(repos);
  const executionEngine = new ExecutionEngineService(repos);
  const completionInference = new CompletionInferenceService(repos);
  const executionLearning = new ExecutionLearningService(repos);
  const executionCoach = new ExecutionCoachService(repos);
  const alarmEngine = new AlarmEngineService(repos);
  const reminderEngine = new ReminderEngineService(repos);
  const dailyPlanner = new DailyPlannerService(repos);
  return {
    repos,
    events: new EventService(repos),
    timeline: new TimelineService(repos),
    activity: new ActivityService(repos),
    revision: new RevisionService(repos),
    problems: new ProblemsService(repos, platform.eventBus),
    analytics: new AnalyticsService(repos),
    roadmaps: new RoadmapService(repos),
    roadmapCoach: new RoadmapCoachService(repos),
    concepts: new ConceptService(repos),
    iit: new IitService(repos),
    ai: new AiService(repos),
    taxonomy: new TaxonomyService(repos),
    dashboardAggregation: new DashboardAggregationService(repos),
    knowledgeGraph: new KnowledgeGraphService(repos),
    knowledge: new KnowledgeService(repos),
    context: new ContextEngineService(repos),
    habitEngine: new HabitEngineService(repos),
    memoryIntelligence: new MemoryIntelligenceService(repos),
    memoryCoach: new MemoryCoachService(repos),
    memoryHealth: new MemoryHealthService(repos),
    knowledgeHealth: new KnowledgeHealthService(repos),
    learningGapEngine: new LearningGapEngine(repos),
    resourceEffectiveness: new ResourceEffectivenessService(repos),
    knowledgeCoach: new KnowledgeCoachService(repos),
    academicHealth: new AcademicHealthService(repos),
    gpaProjection: new GpaProjectionService(repos),
    academicPerformance: new AcademicPerformanceService(repos),
    academicSimulator: new AcademicSimulatorService(repos),
    placementReadiness: new PlacementReadinessService(repos),
    academicCoach: new AcademicCoachService(repos),
    studentIntelligence: new StudentIntelligenceCoreService(repos),
    studentCoach: new StudentCoachService(repos),
    coachOutcome: new CoachOutcomeService(repos),
    project: new ProjectService(repos),
    projectCoach: new ProjectCoachService(repos),
    businessCoach: new BusinessCoachService(repos),
    quoteEngine: new QuoteEngineService(repos),
    client: new ClientService(repos),
    pipeline: new PipelineService(repos),
    invoice: new InvoiceService(repos),
    finance: new FinanceService(repos),
    executionEngine,
    completionInference,
    executionLearning,
    executionCoach,
    alarmEngine,
    reminderEngine,
    goalService: new GoalService(repos),
    dailyPlanner,
    naturalLanguagePlanning: new NaturalLanguagePlanningService(
      repos,
      completionInference,
      executionEngine,
      dailyPlanner,
      executionCoach,
      executionLearning,
    ),
    semanticMemory: new SemanticMemoryService(repos),
    resource: new ResourceService(repos),
    memoryGraph: new MemoryGraphService(repos),
    resourcePipeline: new ResourcePipelineService(repos),
    universalSearch: new UniversalSearchService(repos),
    universalIntake: new UniversalIntakeService(repos),

    // Phase 8 — Core Platform services
    platform,
    eventBus: platform.eventBus,
    workflowEngine: platform.workflowEngine,
    intelligenceEngine: platform.intelligenceEngine,
    contextManager: platform.contextManager,
    ruleEngine: platform.ruleEngine,
    automationEngine: platform.automationEngine,
    predictionEngine: platform.predictionEngine,
    jobQueue: platform.jobQueue,
    cacheManager: platform.cacheManager,
    permissionGuard: platform.permissionGuard,
  };
}

export type Services = ReturnType<typeof createServices>;
