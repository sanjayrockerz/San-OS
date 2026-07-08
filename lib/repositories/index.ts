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

export * from "./execution.repository";
export * from "./context.repository";
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
export * from "./knowledge.repository";
export * from "./reminders.repository";
export * from "./notifications.repository";
export * from "./preferences.repository";
export * from "./memory.repository";
export * from "./projects.repository";
export * from "./clients.repository";
export * from "./pipeline.repository";
export * from "./invoices.repository";
export * from "./finance.repository";
export * from "./academic.repository";
export * from "./resources.repository";
export * from "./calendar.repository";
export * from "./memory-graph.repository";

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
import {
  KnowledgeItemsRepository,
  KnowledgeLinksRepository,
} from "./knowledge.repository";
import { UserContextRepository } from "./context.repository";
import { RemindersRepository } from "./reminders.repository";
import { NotificationsRepository } from "./notifications.repository";
import { UserPreferencesRepository } from "./preferences.repository";
import {
  RecallGradesRepository,
  RecallStrengthRepository,
  TopicMemoryHealthRepository,
} from "./memory.repository";
import {
  ProjectsRepository,
  ProjectTasksRepository,
  ProjectMilestonesRepository,
  ProjectTimeEntriesRepository,
  ProjectDocumentsRepository,
  ProjectChangeRequestsRepository,
  ProjectQuotesRepository,
} from "./projects.repository";
import { ClientsRepository } from "./clients.repository";
import { PipelineEntriesRepository } from "./pipeline.repository";
import { InvoicesRepository } from "./invoices.repository";
import {
  IncomeEntriesRepository,
  ExpenseEntriesRepository,
} from "./finance.repository";
import {
  AcademicSemestersRepository,
  AcademicGoalsRepository,
} from "./academic.repository";
import {
  TimeBlocksRepository,
  UserGoalsRepository,
  FocusSessionsRepository,
  CaptureItemsRepository,
  ScratchpadItemsRepository,
  DailyPlansRepository,
} from "./execution.repository";
import { ResourcesRepository, ResourceLinksRepository } from "./resources.repository";
import { CalendarConnectionsRepository, CalendarSyncLogRepository } from "./calendar.repository";
import { MemoryEdgesRepository, MemoryNodesRepository } from "./memory-graph.repository";

/**
 * Constructs every repository bound to a single Supabase client. Services
 * accept the returned bundle so a request handler wires the client exactly once.
 */
export function createRepositories(client: DbClient) {
  return {
    rawClient: client,
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
    knowledge: new KnowledgeItemsRepository(client),
    knowledgeLinks: new KnowledgeLinksRepository(client),
    userContext: new UserContextRepository(client),
    reminders: new RemindersRepository(client),
    notifications: new NotificationsRepository(client),
    userPreferences: new UserPreferencesRepository(client),
    recallGrades: new RecallGradesRepository(client),
    recallStrength: new RecallStrengthRepository(client),
    topicMemoryHealth: new TopicMemoryHealthRepository(client),
    projects: new ProjectsRepository(client),
    projectTasks: new ProjectTasksRepository(client),
    projectMilestones: new ProjectMilestonesRepository(client),
    projectTimeEntries: new ProjectTimeEntriesRepository(client),
    projectDocuments: new ProjectDocumentsRepository(client),
    projectChangeRequests: new ProjectChangeRequestsRepository(client),
    projectQuotes: new ProjectQuotesRepository(client),
    clients: new ClientsRepository(client),
    pipelineEntries: new PipelineEntriesRepository(client),
    invoices: new InvoicesRepository(client),
    incomeEntries: new IncomeEntriesRepository(client),
    expenseEntries: new ExpenseEntriesRepository(client),
    academicSemesters: new AcademicSemestersRepository(client),
    academicGoals: new AcademicGoalsRepository(client),
    timeBlocks: new TimeBlocksRepository(client),
    userGoals: new UserGoalsRepository(client),
    focusSessions: new FocusSessionsRepository(client),
    captureItems: new CaptureItemsRepository(client),
    scratchpadItems: new ScratchpadItemsRepository(client),
    dailyPlans: new DailyPlansRepository(client),
    resources: new ResourcesRepository(client),
    resourceLinks: new ResourceLinksRepository(client),
    calendarConnections: new CalendarConnectionsRepository(client),
    calendarSyncLog: new CalendarSyncLogRepository(client),
    memoryEdges: new MemoryEdgesRepository(client),
    memoryNodes: new MemoryNodesRepository(client),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
