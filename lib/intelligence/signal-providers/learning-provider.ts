import type { Repositories } from "@/lib/repositories";
import type { Signal, SignalProvider } from "../types";

export class LearningSignalProvider implements SignalProvider {
  readonly id = "learning-signals";
  readonly domain = "learning" as const;

  constructor(private readonly repos: Repositories) {}

  async collect(userId: string): Promise<Signal[]> {
    const signals: Signal[] = [];
    const now = new Date().toISOString();

    const revisionItems = await this.repos.revision.findByUser(userId).catch(() => []);

    for (const item of revisionItems.slice(0, 10)) {
      if (item.last_revision) {
        const lastRev = new Date(item.last_revision);
        const daysSince = Math.ceil((Date.now() - lastRev.getTime()) / 86400000);
        if (daysSince >= 3) {
          signals.push({
            id: `learning-due-${item.id}`,
            domain: "learning",
            type: "revision_due",
            title: `Revision overdue (${daysSince}d)`,
            description: `Problem ${item.problem_id} due for review`,
            urgency: Math.min(1, daysSince / 14),
            impact: 0.6,
            confidence: 0.9,
            entityType: "revision_queue",
            entityId: item.id,
            createdAt: now,
          });
        }
      }

      if (item.current_state === "struggling") {
        signals.push({
          id: `learning-weak-${item.id}`,
          domain: "learning",
          type: "weak_problem",
          title: "Problem needs strengthening",
          description: "Marked as struggling",
          urgency: 0.6,
          impact: 0.7,
          confidence: 0.8,
          entityType: "revision_queue",
          entityId: item.id,
          createdAt: now,
        });
      }
    }

    return signals;
  }
}
