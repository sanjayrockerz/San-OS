import type { Repositories } from "@/lib/repositories";
import type { Signal, SignalProvider } from "../types";

export class AcademicSignalProvider implements SignalProvider {
  readonly id = "academic-signals";
  readonly domain = "academic" as const;

  constructor(private readonly repos: Repositories) {}

  async collect(userId: string): Promise<Signal[]> {
    const signals: Signal[] = [];
    const now = new Date().toISOString();

    const assignments = await this.repos.iitAssignments
      .upcoming(userId, now)
      .catch(() => []);

    for (const assignment of assignments) {
      if (assignment.due_date) {
        const daysUntil = Math.ceil(
          (new Date(assignment.due_date).getTime() - Date.now()) / 86400000,
        );
        signals.push({
          id: `academic-assignment-${assignment.id}`,
          domain: "academic",
          type: "assignment_due",
          title: `Assignment: ${assignment.title}`,
          description: `Due in ${daysUntil} days`,
          urgency: Math.min(1, Math.max(0, 1 - daysUntil / 14)),
          impact: 0.6,
          confidence: 0.9,
          entityType: "iit_assignment",
          entityId: assignment.id,
          createdAt: now,
          expiresAt: assignment.due_date,
        });
      }
    }

    return signals;
  }
}
