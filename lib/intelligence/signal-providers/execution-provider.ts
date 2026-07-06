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

    const timeBlocks = await this.repos.timeBlocks
      .findByDate(userId, today)
      .catch(() => []);

    for (const block of timeBlocks) {
      if (!block.is_completed) {
        signals.push({
          id: `execution-block-${block.id}`,
          domain: "execution",
          type: "pending_time_block",
          title: `Time block: ${block.title}`,
          description: `Scheduled for today`,
          urgency: 0.6,
          impact: 0.5,
          confidence: 0.8,
          entityType: "time_block",
          entityId: block.id,
          createdAt: now,
        });
      }
    }

    return signals;
  }
}
