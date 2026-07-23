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
export * from "./calendar-sync.service";
export * from "./universal-search.service";
export * from "./universal-intake.service";
export * from "./voice-recording.service";
export * from "./smart-suggestions.service";

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
import { CalendarSyncService } from "./calendar-sync.service";
import { UniversalSearchService } from "./universal-search.service";
import { UniversalIntakeService } from "./universal-intake.service";
import { VoiceRecordingService } from "./voice-recording.service";
import { SmartSuggestionsEngineService } from "./smart-suggestions.service";

/**
 * Constructs every domain service bound to a single Supabase client. A request
 * handler (Server Action / Route Handler) calls this once with the appropriate
 * client and gets the whole service surface.
 */
export function createServices(client: DbClient) {
  const repos = createRepositories(client);
  const platform = initializePlatform(repos);
  
  // Cache to store singletons created during the lifetime of this Services instance
  const cache: Record<string, any> = {};

  return {
    get repos() { return repos; },
    get platform() { return platform; },
    get eventBus() { return platform.eventBus; },
    get workflowEngine() { return platform.workflowEngine; },
    get intelligenceEngine() { return platform.intelligenceEngine; },
    get contextManager() { return platform.contextManager; },
    get ruleEngine() { return platform.ruleEngine; },
    get automationEngine() { return platform.automationEngine; },
    get predictionEngine() { return platform.predictionEngine; },
    get jobQueue() { return platform.jobQueue; },
    get cacheManager() { return platform.cacheManager; },
    get permissionGuard() { return platform.permissionGuard; },
    
    get events(): EventService { return cache.events ??= new EventService(repos); },
    get timeline(): TimelineService { return cache.timeline ??= new TimelineService(repos); },
    get activity(): ActivityService { return cache.activity ??= new ActivityService(repos); },
    get revision(): RevisionService { return cache.revision ??= new RevisionService(repos); },
    get problems(): ProblemsService { return cache.problems ??= new ProblemsService(repos, platform.eventBus); },
    get analytics(): AnalyticsService { return cache.analytics ??= new AnalyticsService(repos); },
    get roadmaps(): RoadmapService { return cache.roadmaps ??= new RoadmapService(repos); },
    get roadmapCoach(): RoadmapCoachService { return cache.roadmapCoach ??= new RoadmapCoachService(repos); },
    get concepts(): ConceptService { return cache.concepts ??= new ConceptService(repos); },
    get iit(): IitService { return cache.iit ??= new IitService(repos); },
    get ai(): AiService { return cache.ai ??= new AiService(repos); },
    get taxonomy(): TaxonomyService { return cache.taxonomy ??= new TaxonomyService(repos); },
    get dashboardAggregation(): DashboardAggregationService { return cache.dashboardAggregation ??= new DashboardAggregationService(repos); },
    get knowledgeGraph(): KnowledgeGraphService { return cache.knowledgeGraph ??= new KnowledgeGraphService(repos); },
    get knowledge(): KnowledgeService { return cache.knowledge ??= new KnowledgeService(repos); },
    get context(): ContextEngineService { return cache.context ??= new ContextEngineService(repos); },
    get habitEngine(): HabitEngineService { return cache.habitEngine ??= new HabitEngineService(repos); },
    get memoryIntelligence(): MemoryIntelligenceService { return cache.memoryIntelligence ??= new MemoryIntelligenceService(repos); },
    get memoryCoach(): MemoryCoachService { return cache.memoryCoach ??= new MemoryCoachService(repos); },
    get memoryHealth(): MemoryHealthService { return cache.memoryHealth ??= new MemoryHealthService(repos); },
    get knowledgeHealth(): KnowledgeHealthService { return cache.knowledgeHealth ??= new KnowledgeHealthService(repos); },
    get learningGapEngine(): LearningGapEngine { return cache.learningGapEngine ??= new LearningGapEngine(repos); },
    get resourceEffectiveness(): ResourceEffectivenessService { return cache.resourceEffectiveness ??= new ResourceEffectivenessService(repos); },
    get knowledgeCoach(): KnowledgeCoachService { return cache.knowledgeCoach ??= new KnowledgeCoachService(repos); },
    get academicHealth(): AcademicHealthService { return cache.academicHealth ??= new AcademicHealthService(repos); },
    get gpaProjection(): GpaProjectionService { return cache.gpaProjection ??= new GpaProjectionService(repos); },
    get academicPerformance(): AcademicPerformanceService { return cache.academicPerformance ??= new AcademicPerformanceService(repos); },
    get academicSimulator(): AcademicSimulatorService { return cache.academicSimulator ??= new AcademicSimulatorService(repos); },
    get placementReadiness(): PlacementReadinessService { return cache.placementReadiness ??= new PlacementReadinessService(repos); },
    get academicCoach(): AcademicCoachService { return cache.academicCoach ??= new AcademicCoachService(repos); },
    get studentIntelligence(): StudentIntelligenceCoreService { return cache.studentIntelligence ??= new StudentIntelligenceCoreService(repos); },
    get studentCoach(): StudentCoachService { return cache.studentCoach ??= new StudentCoachService(repos); },
    get coachOutcome(): CoachOutcomeService { return cache.coachOutcome ??= new CoachOutcomeService(repos); },
    get project(): ProjectService { return cache.project ??= new ProjectService(repos); },
    get projectCoach(): ProjectCoachService { return cache.projectCoach ??= new ProjectCoachService(repos); },
    get businessCoach(): BusinessCoachService { return cache.businessCoach ??= new BusinessCoachService(repos); },
    get quoteEngine(): QuoteEngineService { return cache.quoteEngine ??= new QuoteEngineService(repos); },
    get client(): ClientService { return cache.client ??= new ClientService(repos); },
    get pipeline(): PipelineService { return cache.pipeline ??= new PipelineService(repos); },
    get invoice(): InvoiceService { return cache.invoice ??= new InvoiceService(repos); },
    get finance(): FinanceService { return cache.finance ??= new FinanceService(repos); },
    
    get executionEngine(): ExecutionEngineService { return cache.executionEngine ??= new ExecutionEngineService(repos); },
    get completionInference(): CompletionInferenceService { return cache.completionInference ??= new CompletionInferenceService(repos); },
    get executionLearning(): ExecutionLearningService { return cache.executionLearning ??= new ExecutionLearningService(repos); },
    get executionCoach(): ExecutionCoachService { return cache.executionCoach ??= new ExecutionCoachService(repos); },
    get alarmEngine(): AlarmEngineService { return cache.alarmEngine ??= new AlarmEngineService(repos); },
    get reminderEngine(): ReminderEngineService { return cache.reminderEngine ??= new ReminderEngineService(repos); },
    get goalService(): GoalService { return cache.goalService ??= new GoalService(repos); },
    get dailyPlanner(): DailyPlannerService { return cache.dailyPlanner ??= new DailyPlannerService(repos); },
    get naturalLanguagePlanning(): NaturalLanguagePlanningService { 
      return cache.naturalLanguagePlanning ??= new NaturalLanguagePlanningService(
        repos,
        this.completionInference,
        this.executionEngine,
        this.dailyPlanner,
        this.executionCoach,
        this.executionLearning,
      );
    },
    get semanticMemory(): SemanticMemoryService { return cache.semanticMemory ??= new SemanticMemoryService(repos); },
    get resource(): ResourceService { return cache.resource ??= new ResourceService(repos); },
    get memoryGraph(): MemoryGraphService { return cache.memoryGraph ??= new MemoryGraphService(repos); },
    get resourcePipeline(): ResourcePipelineService { return cache.resourcePipeline ??= new ResourcePipelineService(repos); },
    get calendarSync(): CalendarSyncService { return cache.calendarSync ??= new CalendarSyncService(repos); },
    get universalSearch(): UniversalSearchService { return cache.universalSearch ??= new UniversalSearchService(repos); },
    get universalIntake(): UniversalIntakeService { return cache.universalIntake ??= new UniversalIntakeService(repos); },
    get voiceRecording(): VoiceRecordingService { return cache.voiceRecording ??= new VoiceRecordingService(repos); },
    get smartSuggestions(): SmartSuggestionsEngineService { return cache.smartSuggestions ??= new SmartSuggestionsEngineService(repos); },
  };
}

export type Services = ReturnType<typeof createServices>;
