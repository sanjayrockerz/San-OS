import type { Repositories } from "@/lib/repositories";
import type { Json, Tables, TablesInsert } from "@/types/database";

import { BaseService } from "./base.service";

/**
 * Canonical domain event types. Use these constants when emitting so producers
 * and consumers (timeline, analytics, AI) agree on the vocabulary. The column
 * is plain text, so new types can be added without a migration.
 */
export const EVENT_TYPES = {
  ProblemCreated: "problem.created",
  ProblemSolved: "problem.solved",
  ReflectionCreated: "reflection.created",
  CodeVersionCreated: "code_version.created",
  RevisionScheduled: "revision.scheduled",
  RevisionSucceeded: "revision.succeeded",
  RevisionFailed: "revision.failed",
  RevisionSnoozed: "revision.snoozed",
  RoadmapProgressed: "roadmap.progressed",
  ConceptCreated: "concept.created",
  ConceptRevised: "concept.revised",
  AssignmentCreated: "assignment.created",
  AssignmentCompleted: "assignment.completed",
  LectureWatched: "lecture.watched",
  DocumentUploaded: "document.uploaded",
  TaxonomyEvolved: "taxonomy.evolved",
  TaxonomyProposed: "taxonomy.proposed",
  TaxonomyAutoAdded: "taxonomy.auto_added",
  TaxonomyApproved: "taxonomy.approved",
  TaxonomyDismissed: "taxonomy.dismissed",
  KnowledgeCreated: "knowledge.created",
  KnowledgeUpdated: "knowledge.updated",
  KnowledgeDeleted: "knowledge.deleted",
  KnowledgeLinked: "knowledge.linked",
  BattlePlanTaskCompleted: "battleplan.task_completed",
  AuthLogin: "auth.login",
  AuthLogout: "auth.logout",
  HabitReminderCreated: "habit.reminder_created",
  HabitReminderMissed: "habit.reminder_missed",
  HabitNotificationSnoozed: "habit.notification_snoozed",
  HabitNotificationCompleted: "habit.notification_completed",
  HabitStreakBroken: "habit.streak_broken",
  HabitFocusModeChanged: "habit.focus_mode_changed",
  MemoryRecallGraded: "memory.recall_graded",
  MemoryHealthComputed: "memory.health_computed",
  MemoryInterventionGenerated: "memory.intervention_generated",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export interface EmitInput {
  eventType: EventType | string;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}

type EventRow = Tables<"events">;

/**
 * The append-only domain event bus. `emit` is the single write path for the
 * immutable `events` stream; every state-changing action funnels through it.
 * Reads power the timeline, analytics and AI engines.
 *
 * `emit` is intentionally fail-soft: a telemetry write must never break the
 * user-facing mutation that produced it. Failures are swallowed (and would be
 * logged by an observability layer in production).
 */
export class EventService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  /** Records one immutable event. Never throws — returns null on failure. */
  async emit(userId: string, input: EmitInput): Promise<EventRow | null> {
    const values: TablesInsert<"events"> = {
      user_id: userId,
      event_type: input.eventType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      payload: (input.payload ?? {}) as Json,
    };
    try {
      return await this.repos.events.create(values);
    } catch {
      return null;
    }
  }

  /** Most recent events for a user. */
  listRecent(userId: string, limit = 50): Promise<EventRow[]> {
    return this.repos.events.recent(userId, limit);
  }

  /** Full event history for one entity (e.g. a problem's lifecycle). */
  getEntityTimeline(
    userId: string,
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<EventRow[]> {
    return this.repos.events.forEntity(userId, entityType, entityId, limit);
  }

  /** A user's recent events (raw) — TimelineService turns these into copy. */
  getUserTimeline(userId: string, limit = 50): Promise<EventRow[]> {
    return this.repos.events.recent(userId, limit);
  }
}
