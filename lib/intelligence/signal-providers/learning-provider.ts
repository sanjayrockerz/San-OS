import type { Repositories } from "@/lib/repositories";
import type { Signal, SignalProvider } from "../types";

export class LearningSignalProvider implements SignalProvider {
  readonly id = "learning-signals";
  readonly domain = "learning" as const;

  constructor(private readonly repos: Repositories) {}

  async collect(userId: string): Promise<Signal[]> {
    const signals: Signal[] = [];
    const now = new Date().toISOString();

    const [dueQueue, weakQueue, concepts] = await Promise.all([
      this.repos.revision.findByUser(userId).catch(() => []),
      this.repos.revision.findByUser(userId).catch(() => []),
      this.repos.concepts.findByUser(userId).catch(() => []),
    ]);

    const dueItems = dueQueue.filter(
      (q) => q.due_date && q.due_date <= now && q.status === "due",
    );
    for (const item of dueItems.slice(0, 10)) {
      signals.push({
        id: `learning-due-${item.id}`,
        domain: "learning",
        type: "revision_due",
        title: "Revision due",
        description: `Problem ${item.problem_id} is due for review`,
        urgency: 0.8,
        impact: 0.6,
        confidence: 0.9,
        entityType: "revision_queue",
        entityId: item.id,
        createdAt: now,
        expiresAt: item.due_date ?? undefined,
      });
    }

    const weakItems = weakQueue.filter((q) => q.status === "weak");
    for (const item of weakItems.slice(0, 5)) {
      signals.push({
        id: `learning-weak-${item.id}`,
        domain: "learning",
        type: "weak_problem",
        title: "Problem needs strengthening",
        description: "Marked as weak in revision queue",
        urgency: 0.6,
        impact: 0.7,
        confidence: 0.8,
        entityType: "revision_queue",
        entityId: item.id,
        createdAt: now,
      });
    }

    const forgottenConcepts = concepts.filter((c) => c.status === "forgotten");
    for (const concept of forgottenConcepts.slice(0, 3)) {
      signals.push({
        id: `learning-concept-${concept.id}`,
        domain: "learning",
        type: "forgotten_concept",
        title: `Re-learn: ${concept.title}`,
        description: "Concept marked as forgotten",
        urgency: 0.5,
        impact: 0.6,
        confidence: 0.7,
        entityType: "concept_note",
        entityId: concept.id,
        createdAt: now,
      });
    }

    return signals;
  }
}
