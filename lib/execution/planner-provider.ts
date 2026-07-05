/**
 * Planner abstraction (§4) — provider boundary.
 *
 * Business logic (server actions, pages) depends on this interface, never on the
 * concrete engine. The shipped implementation is the fully local, deterministic
 * {@link DailyPlannerService}; a future {@link PlannerProvider} could delegate to
 * a local reasoning model (Qwen/Gemma/DeepSeek) behind the same contract without
 * touching any caller.
 */
import type { Repositories } from "@/lib/repositories";
import type {
  DayReviewResult,
  PlannerResult,
  PlannerState,
} from "@/lib/services/daily-planner.service";

export interface PlannerProvider {
  readonly id: string;
  getPlannerState(userId: string, now?: Date): Promise<PlannerState>;
  generateTomorrowPlan(userId: string, now?: Date): Promise<PlannerResult>;
  applyMorningAdjustment(userId: string, now?: Date): Promise<PlannerResult>;
  replanRemainder(userId: string, now?: Date): Promise<PlannerResult>;
  generateEndOfDayReview(userId: string, now?: Date): Promise<DayReviewResult>;
}

/**
 * Resolves the active planner. Constructed lazily to avoid a load-time cycle
 * with the service module (which imports this interface as a type only).
 */
export async function getPlannerProvider(repos: Repositories): Promise<PlannerProvider> {
  const { DailyPlannerService } = await import("@/lib/services/daily-planner.service");
  return new DailyPlannerService(repos) satisfies PlannerProvider;
}
