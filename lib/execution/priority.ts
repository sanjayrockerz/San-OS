/**
 * Priority Engine (Execution Intelligence — §3).
 *
 * A single weighted model that every "what should I do next" surface reads from
 * — nothing else independently ranks execution priority. Do NOT sort by due date
 * alone: due date is one signal among many. Pure and deterministic.
 *
 * Signals (per the spec): deadline proximity, importance (career/academic/
 * financial/relationship impact), estimated effort, focus cost, context
 * switching, and previous postponements. Callers supply whatever signals they
 * have; everything is optional and defaults to a neutral value so partial data
 * still produces a sensible score.
 */
export type PriorityDomain =
  | "learning"
  | "academic"
  | "project"
  | "business"
  | "health"
  | "personal"
  | "finance";

export interface PriorityInput {
  /** 0–100 time-sensitivity (deadline proximity / scheduled time). */
  urgency?: number;
  /** 0–100 impact if done (career, academic, financial, relationship). */
  importance?: number;
  /** Estimated effort in minutes — big tasks are slightly discounted so they
   *  don't permanently block quick wins, but never enough to bury them. */
  estimatedMinutes?: number;
  /** Meetings are time-anchored commitments and get a fixed floor boost. */
  isMeeting?: boolean;
  /** How many times the user already postponed this — debt compounds urgency. */
  postponements?: number;
  /** Number of not-yet-done items this one is blocked by (lowers priority:
   *  can't start) — or set {@link blocksOthers} for the inverse. */
  blockedByCount?: number;
  /** Number of items waiting on this one — unblocking work is high leverage. */
  blocksOthers?: number;
  domain?: PriorityDomain;
}

/** Relative weight of each signal in the composite. Sums are normalised. */
const WEIGHTS = {
  urgency: 0.4,
  importance: 0.35,
  effort: 0.1,
  dependency: 0.15,
} as const;

const DOMAIN_BIAS: Record<PriorityDomain, number> = {
  finance: 6,
  business: 5,
  academic: 4,
  project: 2,
  learning: 1,
  health: 0,
  personal: 0,
};

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Composite 0–100 execution priority. Higher runs first.
 */
export function scorePriority(input: PriorityInput): number {
  const urgency = clamp(input.urgency ?? 40);
  const importance = clamp(input.importance ?? 50);

  // Shorter tasks score marginally higher on the effort axis (quick wins), but
  // the axis is capped so effort never dominates urgency/importance.
  const minutes = input.estimatedMinutes ?? 45;
  const effort = clamp(100 - Math.min(90, (minutes / 120) * 100));

  // Dependency axis: being a blocker raises priority, being blocked lowers it.
  const dependency = clamp(
    50 + (input.blocksOthers ?? 0) * 15 - (input.blockedByCount ?? 0) * 20,
  );

  let score =
    urgency * WEIGHTS.urgency +
    importance * WEIGHTS.importance +
    effort * WEIGHTS.effort +
    dependency * WEIGHTS.dependency;

  // Postponement debt: each skip compounds urgency (the §14 "you skipped this"
  // signal), up to a ceiling.
  score += Math.min(15, (input.postponements ?? 0) * 5);

  // Meetings are fixed commitments — floor them so they never fall off the plan.
  if (input.isMeeting) score = Math.max(score, 70);

  if (input.domain) score += DOMAIN_BIAS[input.domain];

  return Math.round(clamp(score));
}

/** Sorts any items carrying a numeric `priority` highest-first (stable). */
export function byPriority<T extends { priority: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.priority - a.priority);
}
