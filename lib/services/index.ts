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

import { createRepositories, type DbClient } from "@/lib/repositories";

import { ActivityService } from "./activity.service";
import { AiService } from "./ai.service";
import { AnalyticsService } from "./analytics.service";
import { ConceptService } from "./concepts.service";
import { ContextEngineService } from "./context-engine.service";
import { DashboardAggregationService } from "./dashboard-aggregation.service";
import { EventService } from "./event.service";
import { HabitEngineService } from "./habit-engine.service";
import { KnowledgeGraphService } from "./knowledge-graph.service";
import { KnowledgeService } from "./knowledge.service";
import { IitService } from "./iit.service";
import { ProblemsService } from "./problems.service";
import { RevisionService } from "./revision.service";
import { RoadmapService } from "./roadmaps.service";
import { TaxonomyService } from "./taxonomy.service";
import { TimelineService } from "./timeline.service";

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
    concepts: new ConceptService(repos),
    iit: new IitService(repos),
    ai: new AiService(repos),
    taxonomy: new TaxonomyService(repos),
    dashboardAggregation: new DashboardAggregationService(repos),
    knowledgeGraph: new KnowledgeGraphService(repos),
    knowledge: new KnowledgeService(repos),
    context: new ContextEngineService(repos),
    habitEngine: new HabitEngineService(repos),
  };
}

export type Services = ReturnType<typeof createServices>;
