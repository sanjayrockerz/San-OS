/**
 * Repository layer barrel.
 *
 * Repositories own ALL direct database access (per the architecture rules) and
 * contain no business logic. Services compose repositories; Server Actions call
 * services. Every concrete repository binds a single table and takes an injected
 * Supabase client (server, browser, or admin) so the same code runs in every
 * context while RLS is enforced by whichever key the client carries.
 */
export * from "./base.repository";

export * from "./profile.repository";
export * from "./taxonomy.repository";
export * from "./problems.repository";
export * from "./revision.repository";
export * from "./concepts.repository";
export * from "./roadmaps.repository";
export * from "./activity.repository";
export * from "./iit.repository";
export * from "./ai.repository";
export * from "./events.repository";

import type { DbClient } from "./base.repository";
import { UsersProfileRepository } from "./profile.repository";
import {
  TopicsRepository,
  PatternsRepository,
  TaxonomyUsageRepository,
} from "./taxonomy.repository";
import {
  ProblemsRepository,
  ProblemAttemptsRepository,
  ProblemReflectionsRepository,
  ProblemCodeVersionsRepository,
} from "./problems.repository";
import { RevisionQueueRepository } from "./revision.repository";
import {
  ConceptNotesRepository,
  ConceptResourcesRepository,
  ConceptProblemsRepository,
} from "./concepts.repository";
import {
  RoadmapsRepository,
  RoadmapItemsRepository,
  RoadmapProgressRepository,
} from "./roadmaps.repository";
import {
  ActivityLogsRepository,
  StudySessionsRepository,
  DailyLogsRepository,
} from "./activity.repository";
import {
  IitCoursesRepository,
  IitAssignmentsRepository,
  IitLecturesRepository,
  AcademicDocumentsRepository,
} from "./iit.repository";
import { AiDailyBriefsRepository, AiInsightsRepository } from "./ai.repository";
import { EventsRepository } from "./events.repository";

/**
 * Constructs every repository bound to a single Supabase client. Services
 * accept the returned bundle so a request handler wires the client exactly once.
 */
export function createRepositories(client: DbClient) {
  return {
    profile: new UsersProfileRepository(client),
    topics: new TopicsRepository(client),
    patterns: new PatternsRepository(client),
    taxonomyUsage: new TaxonomyUsageRepository(client),
    problems: new ProblemsRepository(client),
    attempts: new ProblemAttemptsRepository(client),
    reflections: new ProblemReflectionsRepository(client),
    codeVersions: new ProblemCodeVersionsRepository(client),
    revision: new RevisionQueueRepository(client),
    concepts: new ConceptNotesRepository(client),
    conceptResources: new ConceptResourcesRepository(client),
    conceptProblems: new ConceptProblemsRepository(client),
    roadmaps: new RoadmapsRepository(client),
    roadmapItems: new RoadmapItemsRepository(client),
    roadmapProgress: new RoadmapProgressRepository(client),
    activity: new ActivityLogsRepository(client),
    studySessions: new StudySessionsRepository(client),
    dailyLogs: new DailyLogsRepository(client),
    iitCourses: new IitCoursesRepository(client),
    iitAssignments: new IitAssignmentsRepository(client),
    iitLectures: new IitLecturesRepository(client),
    academicDocuments: new AcademicDocumentsRepository(client),
    aiBriefs: new AiDailyBriefsRepository(client),
    aiInsights: new AiInsightsRepository(client),
    events: new EventsRepository(client),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
