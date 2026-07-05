import type { Repositories } from "@/lib/repositories";
import type { Signal, SignalProvider } from "../types";

export class ExecutionSignalProvider implements SignalProvider {
  readonly id = "execution-signals";
  readonly domain = "execution" as const;

  constructor(private readonly repos: Repositories) {}

  async collect(userId: string): Promise<Signal[]> {
    const signals: Signal[] = [];
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const [timeBlocks, focusSessions, goals] = await Promise.all([
      this.repos.timeBlocks.findByUser(userId).catch(() => []),
      this.repos.focusSessions.findByUser(userId).catch(() => []),
      this.repos.userGoals.findByUser(userId).catch(() => []),
    ]);

    const todayBlocks = timeBlocks.filter((b) => b.date === today && !b.is_completed);
    for (const block of todayBlocks) {
      signals.push({
        id: `execution-block-${block.id}`,
        domain: "execution",
        type: "pending_time_block",
        title: `Time block: ${block.title}`,
        description: `Scheduled for today at ${block.start_time}`,
        urgency: 0.6,
        impact: 0.5,
        confidence: 0.8,
        entityType: "time_block",
        entityId: block.id,
        createdAt: now,
        metadata: { startTime: block.start_time, duration: block.duration_minutes },
      });
    }

    const incompleteSessions = focusSessions.filter((s) => !s.completed_at);
    for (const session of incompleteSessions.slice(0, 3)) {
      signals.push({
        id: `execution-session-${session.id}`,
        domain: "execution",
        type: "incomplete_focus_session",
        title: `Focus session: ${session.title ?? "Untitled"}`,
        description: "Left incomplete",
        urgency: 0.4,
        impact: 0.5,
        confidence: 0.7,
        entityType: "focus_session",
        entityId: session.id,
        createdAt: now,
      });
    }

    const activeGoals = goals.filter((g) => !g.is_completed);
    for (const goal of activeGoals.slice(0, 5)) {
      signals.push({
        id: `execution-goal-${goal.id}`,
        domain: "execution",
        type: "active_goal",
        title: `Goal: ${goal.title}`,
        description: goal.description ?? "Active execution goal",
        urgency: 0.3,
        impact: 0.6,
        confidence: 0.5,
        entityType: "user_goal",
        entityId: goal.id,
        createdAt: now,
      });
    }

    return signals;
  }
}
