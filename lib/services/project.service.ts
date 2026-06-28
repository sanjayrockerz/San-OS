import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
  CreateMilestoneInput,
  LogTimeInput,
  CreateDocumentInput,
  CreateChangeRequestInput,
  CreateQuoteInput,
} from "@/lib/validators/project";

export interface ProjectHealth {
  projectId: string;
  progressScore: number;
  scheduleHealth: "on_track" | "at_risk" | "delayed";
  budgetHealth: "under" | "on_track" | "over" | "unknown";
  overallScore: number;
  openTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  hoursVariance: number | null;
  nextMilestone: Tables<"project_milestones"> | null;
}

export interface ProjectWithHealth {
  project: Tables<"projects">;
  health: ProjectHealth;
}

export class ProjectService extends BaseService {
  private readonly events: EventService;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
  }

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------

  async listForUser(userId: string): Promise<Tables<"projects">[]> {
    return this.repos.projects.findByUser(userId);
  }

  async findById(id: string): Promise<Tables<"projects"> | null> {
    return this.repos.projects.findById(id);
  }

  async create(userId: string, input: CreateProjectInput): Promise<Tables<"projects">> {
    const project = await this.repos.projects.create({ ...input, user_id: userId });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ProjectCreated,
      entityType: "project",
      entityId: project.id,
      payload: { title: project.title },
    });
    return project;
  }

  async update(userId: string, id: string, input: UpdateProjectInput): Promise<Tables<"projects">> {
    const project = await this.repos.projects.update(id, input);
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ProjectUpdated,
      entityType: "project",
      entityId: id,
      payload: {},
    });
    return project;
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repos.projects.delete(id);
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ProjectArchived,
      entityType: "project",
      entityId: id,
      payload: {},
    });
  }

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  async listTasks(projectId: string): Promise<Tables<"project_tasks">[]> {
    return this.repos.projectTasks.findByProject(projectId);
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<Tables<"project_tasks">> {
    const task = await this.repos.projectTasks.create({ ...input, user_id: userId });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ProjectTaskCreated,
      entityType: "project_task",
      entityId: task.id,
      payload: { projectId: input.project_id, title: task.title },
    });
    return task;
  }

  async updateTask(
    userId: string,
    id: string,
    input: UpdateTaskInput,
  ): Promise<Tables<"project_tasks">> {
    const patch: Partial<Tables<"project_tasks">> = { ...input };
    if (input.status === "completed" && !patch.completed_at) {
      patch.completed_at = new Date().toISOString();
    }
    const task = await this.repos.projectTasks.update(id, patch);
    if (input.status === "completed") {
      this.events.emit(userId, {
        eventType: EVENT_TYPES.ProjectTaskCompleted,
        entityType: "project_task",
        entityId: id,
        payload: { projectId: task.project_id },
      });
    }
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await this.repos.projectTasks.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Milestones
  // ---------------------------------------------------------------------------

  async listMilestones(projectId: string): Promise<Tables<"project_milestones">[]> {
    return this.repos.projectMilestones.findByProject(projectId);
  }

  async createMilestone(
    userId: string,
    input: CreateMilestoneInput,
  ): Promise<Tables<"project_milestones">> {
    return this.repos.projectMilestones.create({ ...input, user_id: userId });
  }

  async completeMilestone(
    userId: string,
    id: string,
  ): Promise<Tables<"project_milestones">> {
    const milestone = await this.repos.projectMilestones.update(id, {
      completed_at: new Date().toISOString(),
    });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ProjectMilestoneCompleted,
      entityType: "project_milestone",
      entityId: id,
      payload: { projectId: milestone.project_id },
    });
    return milestone;
  }

  async deleteMilestone(id: string): Promise<void> {
    await this.repos.projectMilestones.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Time tracking
  // ---------------------------------------------------------------------------

  async listTimeEntries(projectId: string): Promise<Tables<"project_time_entries">[]> {
    return this.repos.projectTimeEntries.findByProject(projectId);
  }

  async logTime(userId: string, input: LogTimeInput): Promise<Tables<"project_time_entries">> {
    const entry = await this.repos.projectTimeEntries.create({
      ...input,
      user_id: userId,
      logged_at: input.logged_at ?? new Date().toISOString(),
    });
    const totalMinutes = await this.repos.projectTimeEntries.totalMinutesByProject(input.project_id);
    await this.repos.projects.updateActualHours(input.project_id, totalMinutes / 60);
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ProjectTimeLogged,
      entityType: "project",
      entityId: input.project_id,
      payload: { minutes: input.minutes, category: input.category },
    });
    return entry;
  }

  async deleteTimeEntry(id: string, projectId: string, userId: string): Promise<void> {
    await this.repos.projectTimeEntries.delete(id);
    const totalMinutes = await this.repos.projectTimeEntries.totalMinutesByProject(projectId);
    await this.repos.projects.updateActualHours(projectId, totalMinutes / 60);
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ProjectTimeLogged,
      entityType: "project",
      entityId: projectId,
      payload: { deleted: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Documents
  // ---------------------------------------------------------------------------

  async listDocuments(projectId: string): Promise<Tables<"project_documents">[]> {
    return this.repos.projectDocuments.findByProject(projectId);
  }

  async createDocument(
    userId: string,
    input: CreateDocumentInput,
  ): Promise<Tables<"project_documents">> {
    return this.repos.projectDocuments.create({ ...input, user_id: userId });
  }

  async updateDocument(
    id: string,
    input: Partial<CreateDocumentInput>,
  ): Promise<Tables<"project_documents">> {
    return this.repos.projectDocuments.update(id, input);
  }

  async deleteDocument(id: string): Promise<void> {
    await this.repos.projectDocuments.delete(id);
  }

  // ---------------------------------------------------------------------------
  // Change Requests
  // ---------------------------------------------------------------------------

  async listChangeRequests(projectId: string): Promise<Tables<"project_change_requests">[]> {
    return this.repos.projectChangeRequests.findByProject(projectId);
  }

  async createChangeRequest(
    userId: string,
    input: CreateChangeRequestInput,
  ): Promise<Tables<"project_change_requests">> {
    return this.repos.projectChangeRequests.create({ ...input, user_id: userId });
  }

  async updateChangeRequest(
    id: string,
    input: Partial<CreateChangeRequestInput & { approved_at: string }>,
  ): Promise<Tables<"project_change_requests">> {
    return this.repos.projectChangeRequests.update(id, input);
  }

  // ---------------------------------------------------------------------------
  // Quotes
  // ---------------------------------------------------------------------------

  async listQuotes(userId: string): Promise<Tables<"project_quotes">[]> {
    return this.repos.projectQuotes.findByUser(userId);
  }

  async listQuotesByProject(projectId: string): Promise<Tables<"project_quotes">[]> {
    return this.repos.projectQuotes.findByProject(projectId);
  }

  async createQuote(userId: string, input: CreateQuoteInput): Promise<Tables<"project_quotes">> {
    return this.repos.projectQuotes.create({ ...input, user_id: userId });
  }

  async updateQuote(
    id: string,
    input: Partial<CreateQuoteInput & { sent_at: string }>,
  ): Promise<Tables<"project_quotes">> {
    return this.repos.projectQuotes.update(id, input);
  }

  // ---------------------------------------------------------------------------
  // Health score
  // ---------------------------------------------------------------------------

  async healthScore(projectId: string): Promise<ProjectHealth> {
    const [tasks, milestones] = await Promise.all([
      this.repos.projectTasks.findByProject(projectId),
      this.repos.projectMilestones.findByProject(projectId),
    ]);

    const project = await this.repos.projects.findById(projectId);
    if (!project) throw new Error("Project not found");

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const blocked = tasks.filter((t) => t.status === "review" || t.status === "testing").length;
    const today = new Date().toISOString().slice(0, 10);
    const overdue = tasks.filter(
      (t) =>
        t.due_date &&
        t.due_date < today &&
        t.status !== "completed" &&
        t.status !== "cancelled",
    ).length;

    const progressScore = total > 0 ? Math.round((completed / total) * 100) : 0;

    let scheduleHealth: ProjectHealth["scheduleHealth"] = "on_track";
    if (project.deadline) {
      const daysLeft =
        (new Date(project.deadline).getTime() - Date.now()) / 86_400_000;
      if (daysLeft < 0) {
        scheduleHealth = "delayed";
      } else if (daysLeft < 7 && progressScore < 80) {
        scheduleHealth = "at_risk";
      }
    }
    if (overdue > 0) scheduleHealth = scheduleHealth === "delayed" ? "delayed" : "at_risk";

    let budgetHealth: ProjectHealth["budgetHealth"] = "unknown";
    if (project.budget && project.budget > 0) {
      const hoursRate = project.budget / (project.estimated_hours ?? 1);
      const estimatedCost = project.actual_hours * hoursRate;
      if (estimatedCost <= project.budget * 0.85) budgetHealth = "under";
      else if (estimatedCost <= project.budget) budgetHealth = "on_track";
      else budgetHealth = "over";
    }

    const hoursVariance =
      project.estimated_hours && project.estimated_hours > 0
        ? Math.round(((project.actual_hours - project.estimated_hours) / project.estimated_hours) * 100)
        : null;

    const scheduleWeight =
      scheduleHealth === "on_track" ? 100 : scheduleHealth === "at_risk" ? 60 : 20;
    const overallScore = Math.round(
      progressScore * 0.5 + scheduleWeight * 0.3 + (overdue === 0 ? 100 : Math.max(0, 100 - overdue * 15)) * 0.2,
    );

    const nextMilestone =
      milestones.find((m) => !m.completed_at && m.target_date) ?? null;

    return {
      projectId,
      progressScore,
      scheduleHealth,
      budgetHealth,
      overallScore,
      openTasks: total - completed,
      completedTasks: completed,
      blockedTasks: blocked,
      overdueTasks: overdue,
      hoursVariance,
      nextMilestone,
    };
  }

  async healthScoreForAll(userId: string): Promise<Map<string, ProjectHealth>> {
    const projects = await this.repos.projects.findByUser(userId);
    const results = new Map<string, ProjectHealth>();
    await Promise.all(
      projects.map(async (p) => {
        try {
          results.set(p.id, await this.healthScore(p.id));
        } catch {
          // skip unhealthy reads
        }
      }),
    );
    return results;
  }
}
