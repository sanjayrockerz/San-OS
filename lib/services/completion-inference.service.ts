import type { Repositories } from "@/lib/repositories";
import { BaseService, isoDate } from "./base.service";
import { inferCompletionSignal, type CompletionSignal } from "@/lib/execution/completion-inference";

export interface CompletionInferenceResult {
  signal: CompletionSignal;
  matchedBlockId: string | null;
  updatedMinutes: number;
  notes: string;
}

export class CompletionInferenceService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  infer(raw: string): CompletionSignal {
    return inferCompletionSignal(raw);
  }

  async record(userId: string, raw: string, overrides?: { minutes?: number | null; now?: Date }): Promise<CompletionInferenceResult> {
    const signal = this.infer(raw);
    const now = overrides?.now ?? new Date();
    const date = isoDate(now);
    const minutes = overrides?.minutes ?? signal.durationMinutes ?? 60;

    const block = await this.findMatchingBlock(userId, date, signal.task);
    let updatedMinutes = 0;
    let matchedBlockId: string | null = null;

    if (block) {
      matchedBlockId = block.id;
      updatedMinutes = block.actual_minutes ?? minutes;
      await this.repos.timeBlocks.updateStatus(block.id, "completed", {
        actual_end_at: now.toISOString(),
        actual_minutes: updatedMinutes,
        focus_score: Math.min(100, Math.round((updatedMinutes / Math.max(1, block.estimated_minutes)) * 80 + 20)),
      });
    }

    const existing = await this.repos.dailyLogs.findByDate(userId, date);
    const previousNotes = existing?.notes?.trim();
    const nextNote = signal.task ? `Worked on ${signal.task}.` : raw;

    const log = await this.repos.dailyLogs.upsertForDate(userId, date, {
      minutes_studied: (existing?.minutes_studied ?? 0) + (
        signal.domain === "learning" || signal.domain === "academic" ? minutes : 0
      ),
      revisions_done: (existing?.revisions_done ?? 0) + (/\b(dp|revision|revise|study|leetcode)\b/i.test(raw) ? 1 : 0),
      notes: previousNotes ? `${previousNotes}\n${nextNote}` : nextNote,
    });

    return {
      signal,
      matchedBlockId,
      updatedMinutes,
      notes: log.notes ?? raw,
    };
  }

  private async findMatchingBlock(userId: string, date: string, task: string | null) {
    if (!task) return null;
    const blocks = await this.repos.timeBlocks.findByDate(userId, date);
    const needle = normalise(task);
    if (!needle) return null;

    return blocks.find((block) => {
      const haystack = normalise(block.title);
      return haystack.includes(needle) || needle.includes(haystack);
    }) ?? null;
  }
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
