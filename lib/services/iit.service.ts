import type { Repositories } from "@/lib/repositories";
import type { Tables, TablesInsert } from "@/types/database";

import { ActivityService } from "./activity.service";
import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";

export interface CreditSummary {
  totalCredits: number;
  completedCredits: number;
  inProgressCredits: number;
}

/**
 * IIT Academic Intelligence service: courses, assignments, lectures and the
 * document vault. Mutations that represent real progress (watching a lecture,
 * completing an assignment, uploading a document) also log activity.
 */
export class IitService extends BaseService {
  private readonly activity: ActivityService;
  private readonly events: EventService;

  constructor(repos: Repositories) {
    super(repos);
    this.activity = new ActivityService(repos);
    this.events = new EventService(repos);
  }

  courses(userId: string): Promise<Tables<"iit_courses">[]> {
    return this.repos.iitCourses.findByUser(userId);
  }

  createCourse(
    userId: string,
    values: Omit<TablesInsert<"iit_courses">, "user_id">,
  ): Promise<Tables<"iit_courses">> {
    return this.repos.iitCourses.create({ ...values, user_id: userId });
  }

  createLecture(
    userId: string,
    values: Omit<TablesInsert<"iit_lectures">, "user_id">,
  ): Promise<Tables<"iit_lectures">> {
    return this.repos.iitLectures.create({ ...values, user_id: userId });
  }

  /**
   * Stores a new assignment, logs the activity, and emits `assignment.created`
   * so it lands on the timeline and feeds dashboard aggregation.
   */
  async createAssignment(
    userId: string,
    values: Omit<TablesInsert<"iit_assignments">, "user_id">,
  ): Promise<Tables<"iit_assignments">> {
    const row = await this.repos.iitAssignments.create({
      ...values,
      user_id: userId,
    });
    await this.activity.log(userId, {
      type: "assignment_completed",
      title: "Added an assignment",
      entityType: "iit_assignment",
      entityId: row.id,
      metadata: { title: row.title, dueDate: row.due_date },
    });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.AssignmentCreated,
      entityType: "iit_assignment",
      entityId: row.id,
      payload: { title: row.title, dueDate: row.due_date },
    });
    return row;
  }

  /** Aggregate credit totals by course status. */
  async creditSummary(userId: string): Promise<CreditSummary> {
    const courses = await this.repos.iitCourses.findByUser(userId);
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    for (const c of courses) {
      const credits = c.credits ?? 0;
      total += credits;
      if (c.status === "completed") completed += credits;
      else if (c.status === "in_progress") inProgress += credits;
    }
    return {
      totalCredits: total,
      completedCredits: completed,
      inProgressCredits: inProgress,
    };
  }

  /** Marks an assignment completed (submitted) and logs the activity. */
  async completeAssignment(
    userId: string,
    assignmentId: string,
    score?: number | null,
  ): Promise<Tables<"iit_assignments">> {
    const row = await this.repos.iitAssignments.update(assignmentId, {
      status: score == null ? "submitted" : "graded",
      score: score ?? null,
      submitted_at: new Date().toISOString(),
    });
    await this.activity.log(userId, {
      type: "assignment_completed",
      title: "Completed an assignment",
      entityType: "iit_assignment",
      entityId: assignmentId,
      metadata: { score },
    });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.AssignmentCompleted,
      entityType: "iit_assignment",
      entityId: assignmentId,
      payload: { title: row.title, score },
    });
    return row;
  }

  /** Marks a lecture watched and logs the activity. */
  async watchLecture(
    userId: string,
    lectureId: string,
  ): Promise<Tables<"iit_lectures">> {
    const row = await this.repos.iitLectures.update(lectureId, {
      status: "completed",
      watched_at: new Date().toISOString(),
    });
    await this.activity.log(userId, {
      type: "lecture_watched",
      title: "Watched a lecture",
      entityType: "iit_lecture",
      entityId: lectureId,
    });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.LectureWatched,
      entityType: "iit_lecture",
      entityId: lectureId,
      payload: { title: row.title },
    });
    return row;
  }

  /** Registers an uploaded document in the vault and logs the activity. */
  async addDocument(
    userId: string,
    values: Omit<TablesInsert<"academic_documents">, "user_id">,
  ): Promise<Tables<"academic_documents">> {
    const doc = await this.repos.academicDocuments.create({
      ...values,
      user_id: userId,
    });
    await this.activity.log(userId, {
      type: "document_uploaded",
      title: "Uploaded a document",
      entityType: "academic_document",
      entityId: doc.id,
      metadata: { type: doc.type },
    });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.DocumentUploaded,
      entityType: "academic_document",
      entityId: doc.id,
      payload: { title: doc.title, type: doc.type },
    });
    return doc;
  }
}
