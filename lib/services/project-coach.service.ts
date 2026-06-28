import type { Repositories } from "@/lib/repositories";

import { BaseService } from "./base.service";
import { scoreAction } from "./student-action-scoring";
import type { RiskEntry, RiskLevel, StudentAction } from "./student-intelligence-core.service";

export interface ProjectAction extends StudentAction {
  source: "project";
}

/**
 * ProjectCoachService — maps project state onto StudentAction/RiskEntry so
 * project work flows through StudentIntelligenceCoreService's single ranking
 * pipeline, surfacing on Mission Control alongside DSA and academic work.
 */
export class ProjectCoachService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async actions(userId: string): Promise<ProjectAction[]> {
    const [overdueTasks, upcomingMilestones, urgentTasks] = await Promise.all([
      safeResolve(this.repos.projectTasks.findOverdueTasks(userId), []),
      safeResolve(this.repos.projectMilestones.findUpcomingForUser(userId, 7), []),
      safeResolve(this.repos.projectTasks.findByStatus(userId, "in_progress"), []),
    ]);

    const actions: ProjectAction[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const task of overdueTasks.slice(0, 6)) {
      const daysOverdue = task.due_date
        ? Math.ceil((Date.now() - new Date(task.due_date).getTime()) / 86_400_000)
        : 1;
      actions.push(
        this.makeAction({
          kind: "complete_project_task" as StudentAction["kind"],
          title: task.title,
          detail: `Overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}.`,
          href: `/projects/${task.project_id}?tab=tasks`,
          entityId: task.project_id,
          estimatedMinutes: task.estimated_minutes ?? 30,
          urgency: Math.min(0.95, 0.6 + daysOverdue * 0.05),
          impact: task.priority === "critical" ? 0.9 : task.priority === "high" ? 0.75 : 0.6,
          momentum: 0.4,
          lastTouchedAt: task.updated_at,
        }),
      );
    }

    for (const milestone of upcomingMilestones.slice(0, 3)) {
      const daysUntil = milestone.target_date
        ? Math.ceil((new Date(milestone.target_date).getTime() - Date.now()) / 86_400_000)
        : 7;
      actions.push(
        this.makeAction({
          kind: "review_project_milestone" as StudentAction["kind"],
          title: `Milestone: ${milestone.title}`,
          detail: `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`,
          href: `/projects/${milestone.project_id}?tab=overview`,
          entityId: milestone.project_id,
          estimatedMinutes: 15,
          urgency: Math.min(0.9, 1 - daysUntil / 7),
          impact: 0.7,
          momentum: 0.5,
          lastTouchedAt: milestone.updated_at,
        }),
      );
    }

    for (const task of urgentTasks
      .filter((t) => t.priority === "critical" || t.priority === "high")
      .slice(0, 4)) {
      const isBlocker = !overdueTasks.some((o) => o.id === task.id);
      if (!isBlocker) continue;
      actions.push(
        this.makeAction({
          kind: "complete_project_task" as StudentAction["kind"],
          title: `${task.priority === "critical" ? "🔴 " : ""}${task.title}`,
          detail: "High-priority in-progress task.",
          href: `/projects/${task.project_id}?tab=tasks`,
          entityId: task.project_id,
          estimatedMinutes: task.estimated_minutes ?? 45,
          urgency: task.priority === "critical" ? 0.8 : 0.65,
          impact: 0.7,
          momentum: 0.6,
          lastTouchedAt: task.updated_at,
        }),
      );
    }

    return actions.sort((a, b) => b.score - a.score);
  }

  async risks(userId: string): Promise<RiskEntry[]> {
    const [overdueTasks, upcomingDeadlines] = await Promise.all([
      safeResolve(this.repos.projectTasks.findOverdueTasks(userId), []),
      safeResolve(this.repos.projects.findUpcomingDeadlines(userId, 7), []),
    ]);

    const entries: RiskEntry[] = [];

    for (const task of overdueTasks.slice(0, 5)) {
      const daysOverdue = task.due_date
        ? Math.ceil((Date.now() - new Date(task.due_date).getTime()) / 86_400_000)
        : 1;
      const riskLevel: RiskLevel =
        daysOverdue >= 7 ? "critical" : daysOverdue >= 3 ? "high" : "medium";
      entries.push({
        entityType: "project_task",
        entityId: task.id,
        name: task.title,
        riskLevel,
        reason: `Task overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}.`,
        recommendedAction: {
          label: "Open task",
          href: `/projects/${task.project_id}?tab=tasks`,
          entityId: task.project_id,
        },
      });
    }

    for (const project of upcomingDeadlines.slice(0, 3)) {
      const daysLeft = project.deadline
        ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86_400_000)
        : null;
      if (daysLeft === null) continue;
      const riskLevel: RiskLevel = daysLeft <= 2 ? "critical" : daysLeft <= 5 ? "high" : "medium";
      entries.push({
        entityType: "project",
        entityId: project.id,
        name: project.title,
        riskLevel,
        reason: `Project deadline in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        recommendedAction: {
          label: "Open project",
          href: `/projects/${project.id}`,
          entityId: project.id,
        },
      });
    }

    return entries;
  }

  private makeAction(
    input: Omit<ProjectAction, "id" | "score" | "source">,
  ): ProjectAction {
    return {
      ...input,
      id: `project-${input.kind}-${input.entityId ?? input.title}`,
      source: "project",
      score: scoreAction(input),
    };
  }
}

async function safeResolve<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
