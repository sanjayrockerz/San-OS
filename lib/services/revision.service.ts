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

  /** Items due on or before now — the daily revision queue. */
  dueQueue(userId: string): Promise<Tables<"revision_queue">[]> {
    return this.repos.revision.findDue(userId, new Date().toISOString());
  }

  /** Items the engine considers weak (struggling state). */
  weakQueue(userId: string): Promise<Tables<"revision_queue">[]> {
    return this.repos.revision.findByState(userId, "struggling");
  }
}
