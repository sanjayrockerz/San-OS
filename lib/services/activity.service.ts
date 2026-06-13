import type { Repositories } from "@/lib/repositories";
import type { Tables, TablesInsert } from "@/types/database";

import { BaseService, isoDate } from "./base.service";

export type ActivityType = Tables<"activity_logs">["type"];

export interface LogActivityInput {
  type: ActivityType;
  title?: string | null;
  description?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

/** A single day's bucket in a contribution heatmap. */
export interface HeatmapCell {
  date: string;
  count: number;
}

/** Per-day daily_logs counters a workflow can nudge when logging activity. */
export interface DailyCounters {
  problems_solved?: number;
  minutes_studied?: number;
  revisions_done?: number;
}

/**
 * Writes to the append-only activity stream and keeps the daily_logs roll-up in
 * sync. Other services call {@link log} so every meaningful action shows up on
 * the timeline and contribution heatmap.
 */
export class ActivityService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  /** Records one activity event for a user and returns the stored row. */
  async log(
    userId: string,
    input: LogActivityInput,
  ): Promise<Tables<"activity_logs">> {
    const values: TablesInsert<"activity_logs"> = {
      user_id: userId,
      type: input.type,
      title: input.title ?? null,
      description: input.description ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as TablesInsert<"activity_logs">["metadata"],
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    };
    return this.repos.activity.create(values);
  }

  /**
   * Increments the day's daily_logs counters, creating the row if absent.
   * Idempotent per call (adds the supplied deltas), used by solve/revision flows.
   */
  async bumpDailyCounters(
    userId: string,
    deltas: DailyCounters,
    date = isoDate(),
  ): Promise<Tables<"daily_logs">> {
    const existing = await this.repos.dailyLogs.findByDate(userId, date);
    if (!existing) {
      return this.repos.dailyLogs.create({
        user_id: userId,
        log_date: date,
        problems_solved: deltas.problems_solved ?? 0,
        minutes_studied: deltas.minutes_studied ?? 0,
        revisions_done: deltas.revisions_done ?? 0,
      });
    }
    return this.repos.dailyLogs.update(existing.id, {
      problems_solved: existing.problems_solved + (deltas.problems_solved ?? 0),
      minutes_studied: existing.minutes_studied + (deltas.minutes_studied ?? 0),
      revisions_done: existing.revisions_done + (deltas.revisions_done ?? 0),
    });
  }

  /** The recent timeline (most recent first). */
  timeline(userId: string, limit = 50): Promise<Tables<"activity_logs">[]> {
    return this.repos.activity.recent(userId, limit);
  }

  /**
   * GitHub-style contribution heatmap for the trailing `days` window: one cell
   * per calendar day with the activity-event count.
   */
  async heatmap(userId: string, days = 365): Promise<HeatmapCell[]> {
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - (days - 1));

    const events = await this.repos.activity.between(
      userId,
      from.toISOString(),
      to.toISOString(),
    );

    const counts = new Map<string, number>();
    for (const e of events) {
      const day = e.occurred_at.slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }

    const cells: HeatmapCell[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setUTCDate(from.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      cells.push({ date: key, count: counts.get(key) ?? 0 });
    }
    return cells;
  }
}
