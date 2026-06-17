import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";

type RevisionState = Tables<"revision_queue">["current_state"];

/**
 * Interval ladder (in days) indexed by successful-revision count. A successful
 * review advances along the ladder; a failure resets to the first rung. This is
 * a deliberately simple SM-2-style schedule — predictable and easy to reason
 * about — that satisfies the Forgetting Engine's needs.
 */
const INTERVALS_DAYS = [1, 3, 7, 16, 35, 70] as const;

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function intervalFor(successCount: number): number {
  const idx = Math.min(successCount, INTERVALS_DAYS.length - 1);
  return INTERVALS_DAYS[idx];
}

/** State transition derived from the success/failure history. */
function nextState(successCount: number, failureCount: number): RevisionState {
  if (failureCount >= 2 && successCount === 0) return "struggling";
  if (successCount >= INTERVALS_DAYS.length - 1) return "mastered";
  if (successCount >= 1) return "reviewing";
  return "learning";
}

/**
 * Owns the Revision & Forgetting Engine: scheduling, the daily due queue, and
 * recording review outcomes. The scheduling maths lives here, not in the
 * repository.
 */
export class RevisionService extends BaseService {
  private readonly events: EventService;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
  }

  /**
   * Ensures a queue entry exists for (user, problem) and schedules the first
   * revision. Called after a problem is solved. No-op-friendly: if an entry
   * already exists it is returned unchanged.
   */
  async scheduleAfterSolve(
    userId: string,
    problemId: string,
    editorialUsed = false,
  ): Promise<Tables<"revision_queue">> {
    const existing = await this.repos.revision.findByProblem(userId, problemId);
    if (existing) return existing;

    const now = new Date();
    return this.repos.revision.create({
      user_id: userId,
      problem_id: problemId,
      current_state: "learning",
      last_revision: now.toISOString(),
      next_revision: addDays(now, intervalFor(0)).toISOString(),
      success_count: 0,
      failure_count: 0,
      editorial_dependency: editorialUsed,
    });
  }

  /**
   * Records the outcome of a revision and reschedules. `success` advances the
   * interval ladder; failure resets it and flags the item as struggling. Also
   * logs activity and bumps the day's revision counter via the caller-supplied
   * ActivityService is intentionally NOT done here to keep this service pure —
   * the orchestrating Server Action composes them.
   */
  async recordReview(
    userId: string,
    problemId: string,
    success: boolean,
    editorialUsed = false,
  ): Promise<Tables<"revision_queue">> {
    const entry =
      (await this.repos.revision.findByProblem(userId, problemId)) ??
      (await this.scheduleAfterSolve(userId, problemId, editorialUsed));

    const now = new Date();
    const successCount = success ? entry.success_count + 1 : 0;
    const failureCount = success
      ? entry.failure_count
      : entry.failure_count + 1;
    const interval = intervalFor(successCount);

    const updated = await this.repos.revision.update(entry.id, {
      current_state: nextState(successCount, failureCount),
      last_revision: now.toISOString(),
      next_revision: addDays(now, interval).toISOString(),
      success_count: successCount,
      failure_count: failureCount,
      editorial_dependency: editorialUsed || entry.editorial_dependency,
    });

    await this.events.emit(userId, {
      eventType: success
        ? EVENT_TYPES.RevisionSucceeded
        : EVENT_TYPES.RevisionFailed,
      entityType: "problem",
      entityId: problemId,
      payload: {
        nextRevision: updated.next_revision,
        state: updated.current_state,
      },
    });

    return updated;
  }

  /**
   * Pushes a problem's next revision out by `days` (default 1) without touching
   * its success/failure history or interval ladder — a deliberate "not today".
   * Emits `revision.snoozed`.
   */
  async snooze(
    userId: string,
    problemId: string,
    days = 1,
  ): Promise<Tables<"revision_queue">> {
    const entry =
      (await this.repos.revision.findByProblem(userId, problemId)) ??
      (await this.scheduleAfterSolve(userId, problemId));

    const from = new Date(entry.next_revision ?? new Date().toISOString());
    const updated = await this.repos.revision.update(entry.id, {
      next_revision: addDays(from, days).toISOString(),
    });

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.RevisionSnoozed,
      entityType: "problem",
      entityId: problemId,
      payload: { nextRevision: updated.next_revision, days },
    });
    return updated;
  }

  /** Items due on or before now — the daily revision queue. */
  dueQueue(userId: string): Promise<Tables<"revision_queue">[]> {
    return this.repos.revision.findDue(userId, new Date().toISOString());
  }

  /** Items the engine considers weak (struggling state). */
  weakQueue(userId: string): Promise<Tables<"revision_queue">[]> {
    return this.repos.revision.findByState(userId, "struggling");
  }

  /**
   * Assembles the full Revision Workspace read model in one call: the hero
   * summary (due count, weakest topic, estimated time, streak) plus a detailed
   * card for every problem due today. All the joins/derivations live here so the
   * page holds no analytics logic and issues no direct domain queries.
   */
  async workspace(userId: string): Promise<RevisionWorkspace> {
    const now = new Date();
    const [due, weak, problems, topics, patterns, attempts, reflections, logs] =
      await Promise.all([
        this.dueQueue(userId),
        this.weakQueue(userId),
        this.repos.problems.listVisible(userId),
        this.repos.topics.listVisible(userId),
        this.repos.patterns.listVisible(userId),
        this.repos.attempts.findByUser(userId),
        this.repos.reflections.findByUser(userId),
        this.recentDailyLogs(userId, 60),
      ]);

    const problemById = new Map(problems.map((p) => [p.id, p]));
    const topicById = new Map(topics.map((t) => [t.id, t]));
    const patternById = new Map(patterns.map((p) => [p.id, p]));

    // attempts / reflections come newest-first; first hit per problem wins.
    const latestAttempt = new Map<string, Tables<"problem_attempts">>();
    const latestSolved = new Map<string, Tables<"problem_attempts">>();
    for (const a of attempts) {
      if (!latestAttempt.has(a.problem_id)) latestAttempt.set(a.problem_id, a);
      if (
        a.solve_status &&
        SOLVED_STATUSES.has(a.solve_status) &&
        !latestSolved.has(a.problem_id)
      ) {
        latestSolved.set(a.problem_id, a);
      }
    }
    const latestReflection = new Map<string, Tables<"problem_reflections">>();
    for (const r of reflections) {
      if (!latestReflection.has(r.problem_id)) latestReflection.set(r.problem_id, r);
    }

    const cards: RevisionCard[] = due.map((entry) => {
      const problem = problemById.get(entry.problem_id);
      const topic = problem?.topic_id ? topicById.get(problem.topic_id) : null;
      const pattern = problem?.pattern_id
        ? patternById.get(problem.pattern_id)
        : null;
      const attempt = latestAttempt.get(entry.problem_id);
      const solved = latestSolved.get(entry.problem_id);
      const reflection = latestReflection.get(entry.problem_id);

      const lastRevised = entry.last_revision;
      const daysSinceReview = lastRevised
        ? Math.floor((now.getTime() - new Date(lastRevised).getTime()) / DAY_MS)
        : null;
      const overdueDays = entry.next_revision
        ? Math.floor((now.getTime() - new Date(entry.next_revision).getTime()) / DAY_MS)
        : 0;

      return {
        problemId: entry.problem_id,
        title: problem?.title ?? "Untitled problem",
        difficulty: problem?.difficulty ?? null,
        topic: topic ? { id: topic.id, name: topic.name } : null,
        pattern: pattern ? { id: pattern.id, name: pattern.name } : null,
        state: entry.current_state,
        confidence: attempt?.confidence ?? null,
        lastSolved: solved?.attempted_at ?? solved?.created_at ?? null,
        lastRevised,
        daysSinceReview,
        urgency: urgencyFor(entry.current_state, overdueDays),
        estimatedMinutes: problem?.estimated_minutes ?? DEFAULT_REVISION_MINUTES,
        algorithm: reflection?.algorithm_in_words ?? reflection?.my_explanation ?? null,
        lastMistake: reflection?.bug_that_stopped_me ?? null,
        takeaway: reflection?.final_takeaway ?? null,
      };
    });

    // Weakest topic = the topic with the most struggling problems.
    const weakCounts = new Map<string, number>();
    for (const w of weak) {
      const tid = problemById.get(w.problem_id)?.topic_id;
      if (tid) weakCounts.set(tid, (weakCounts.get(tid) ?? 0) + 1);
    }
    let weakestTopic: string | null = null;
    let weakestCount = 0;
    for (const [tid, count] of weakCounts) {
      if (count > weakestCount) {
        weakestCount = count;
        weakestTopic = topicById.get(tid)?.name ?? null;
      }
    }

    const estimatedMinutes = cards.reduce((sum, c) => sum + c.estimatedMinutes, 0);

    return {
      hero: {
        dueToday: due.length,
        weakestTopic,
        estimatedMinutes,
        streak: streakFromLogs(logs, now),
      },
      cards,
    };
  }

  /** Daily logs for the last `days` days (for streak computation). */
  private async recentDailyLogs(
    userId: string,
    days: number,
  ): Promise<Tables<"daily_logs">[]> {
    const to = new Date();
    const from = new Date(to.getTime() - days * DAY_MS);
    return this.repos.dailyLogs.between(
      userId,
      from.toISOString().slice(0, 10),
      to.toISOString().slice(0, 10),
    );
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_REVISION_MINUTES = 8;
const SOLVED_STATUSES = new Set(["solved", "solved_with_help", "partial"]);

export type RevisionUrgency = "high" | "medium" | "low";

function urgencyFor(state: RevisionState, overdueDays: number): RevisionUrgency {
  if (state === "struggling" || overdueDays >= 3) return "high";
  if (overdueDays >= 1) return "medium";
  return "low";
}

/** Consecutive days (ending today or yesterday) with a revision logged. */
function streakFromLogs(logs: Tables<"daily_logs">[], now: Date): number {
  const active = new Set(
    logs
      .filter((l) => (l.revisions_done ?? 0) > 0)
      .map((l) => l.log_date),
  );
  let streak = 0;
  const cursor = new Date(now);
  // Allow the streak to be intact even if today's revision isn't done yet.
  if (!active.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (active.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/** A revision-queue entry resolved into everything the workspace card renders. */
export interface RevisionCard {
  problemId: string;
  title: string;
  difficulty: Tables<"problems">["difficulty"];
  topic: { id: string; name: string } | null;
  pattern: { id: string; name: string } | null;
  state: RevisionState;
  confidence: number | null;
  lastSolved: string | null;
  lastRevised: string | null;
  daysSinceReview: number | null;
  urgency: RevisionUrgency;
  estimatedMinutes: number;
  algorithm: string | null;
  lastMistake: string | null;
  takeaway: string | null;
}

/** Hero numbers for the top of the revision workspace. */
export interface RevisionHero {
  dueToday: number;
  weakestTopic: string | null;
  estimatedMinutes: number;
  streak: number;
}

export interface RevisionWorkspace {
  hero: RevisionHero;
  cards: RevisionCard[];
}
