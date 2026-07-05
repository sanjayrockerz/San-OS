import type { Repositories } from "@/lib/repositories";
import type { Signal, SignalProvider } from "../types";

export class AcademicSignalProvider implements SignalProvider {
  readonly id = "academic-signals";
  readonly domain = "academic" as const;

  constructor(private readonly repos: Repositories) {}

  async collect(userId: string): Promise<Signal[]> {
    const signals: Signal[] = [];
    const now = new Date().toISOString();

    const [assignments, courses, academicGoals] = await Promise.all([
      this.repos.iitAssignments.upcoming(userId, now).catch(() => []),
      this.repos.iitCourses.findByUser(userId).catch(() => []),
      this.repos.academicGoals.findByUser(userId).catch(() => []),
    ]);

    for (const assignment of assignments.filter((a) => a.status === "pending")) {
      if (assignment.due_date) {
        const daysUntil = Math.ceil(
          (new Date(assignment.due_date).getTime() - Date.now()) / 86400000,
        );
        signals.push({
          id: `academic-assignment-${assignment.id}`,
          domain: "academic",
          type: "assignment_due",
          title: `Assignment due: ${assignment.title}`,
          description: `Due in ${daysUntil} days`,
          urgency: Math.min(1, Math.max(0, 1 - daysUntil / 14)),
          impact: 0.6,
          confidence: 0.9,
          entityType: "iit_assignment",
          entityId: assignment.id,
          createdAt: now,
          expiresAt: assignment.due_date,
          metadata: { courseId: assignment.course_id, daysUntil },
        });
      }
    }

    for (const goal of academicGoals.filter((g) => !g.is_achieved)) {
      signals.push({
        id: `academic-goal-${goal.id}`,
        domain: "academic",
        type: "academic_goal",
        title: goal.title ?? "Academic goal",
        description: goal.notes ?? "Tracking academic progress",
        urgency: 0.5,
        impact: 0.7,
        confidence: 0.6,
        entityType: "academic_goal",
        entityId: goal.id,
        createdAt: now,
        metadata: { targetDate: goal.target_date },
      });
    }

    return signals;
  }
}
