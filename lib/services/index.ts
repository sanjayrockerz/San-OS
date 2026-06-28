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

import { createRepositories, type DbClient } from "@/lib/repositories";

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

/**
 * Constructs every domain service bound to a single Supabase client. A request
 * handler (Server Action / Route Handler) calls this once with the appropriate
 * client and gets the whole service surface.
 */
export function createServices(client: DbClient) {
  const repos = createRepositories(client);
  return {
    repos,
    events: new EventService(repos),
    timeline: new TimelineService(repos),
    activity: new ActivityService(repos),
    revision: new RevisionService(repos),
    problems: new ProblemsService(repos),
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
  };
}

export type Services = ReturnType<typeof createServices>;
