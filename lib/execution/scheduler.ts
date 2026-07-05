/**
 * Time-Blocking Scheduler (Execution Intelligence — §4/§6).
 *
 * Deterministic placement of prioritised, energy-tagged tasks into the free gaps
 * of a day, working around fixed commitments (meetings, locked or manually
 * created blocks). Pure and side-effect free — the DailyPlannerService feeds it
 * candidates and persists the result; the scheduler itself never touches the DB.
 *
 * Design goals:
 *   • High-priority work is placed first (never starved).
 *   • Energy-aware: high-energy work prefers the morning peak window; low-energy
 *     admin work sinks to later gaps.
 *   • Respects fixed blocks and, for intraday replanning, a "now" cutoff so the
 *     remainder of the day is rescheduled without rewriting the past.
 *   • Inserts a short break after each placed block so plans aren't wall-to-wall.
 */

export type TaskEnergy = "high" | "medium" | "low";

export interface SchedulableTask {
  /** Stable identity for dedupe / linking back to the source signal. */
  key: string;
  title: string;
  domain: string;
  estimatedMinutes: number;
  /** 0–100 composite priority from the Priority Engine / IntelligenceCore. */
  priority: number;
  energy: TaskEnergy;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
}

/** A commitment the scheduler must not overlap (minutes from midnight). */
export interface FixedInterval {
  startMinutes: number;
  endMinutes: number;
}

export interface SchedulerOptions {
  /** Working-day window, minutes from midnight (e.g. 9:00 → 540). */
  dayStartMinutes: number;
  dayEndMinutes: number;
  /** End of the morning high-energy window; high-energy tasks prefer before it. */
  highEnergyEndMinutes: number;
  /** Longest single block; longer tasks are capped (and can repeat another day). */
  maxBlockMinutes: number;
  /** Minimum block length — tasks shorter than this still get this floor. */
  minBlockMinutes: number;
  /** Break inserted after each placed block. */
  breakMinutes: number;
  /** For intraday replanning: don't schedule anything before this minute. */
  nowMinutes?: number | null;
}

export interface ScheduledTask extends SchedulableTask {
  startMinutes: number;
  endMinutes: number;
}

export interface ScheduleResult {
  scheduled: ScheduledTask[];
  /** Tasks that didn't fit the remaining free time, priority order preserved. */
  unscheduled: SchedulableTask[];
}

export const DEFAULT_SCHEDULER_OPTIONS: SchedulerOptions = {
  dayStartMinutes: 9 * 60,
  dayEndMinutes: 21 * 60,
  highEnergyEndMinutes: 13 * 60,
  maxBlockMinutes: 90,
  minBlockMinutes: 15,
  breakMinutes: 10,
  nowMinutes: null,
};

interface Gap {
  start: number;
  end: number;
}

const ENERGY_RANK: Record<TaskEnergy, number> = { high: 0, medium: 1, low: 2 };

/** Free intervals of [dayStart, dayEnd] minus fixed blocks and the past. */
function computeGaps(fixed: FixedInterval[], opts: SchedulerOptions): Gap[] {
  const floor = Math.max(opts.dayStartMinutes, opts.nowMinutes ?? opts.dayStartMinutes);
  const blocks = [...fixed]
    .map((f) => ({ start: Math.max(f.startMinutes, floor), end: Math.min(f.endMinutes, opts.dayEndMinutes) }))
    .filter((f) => f.end > f.start)
    .sort((a, b) => a.start - b.start);

  const gaps: Gap[] = [];
  let cursor = floor;
  for (const block of blocks) {
    if (block.start > cursor) gaps.push({ start: cursor, end: block.start });
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < opts.dayEndMinutes) gaps.push({ start: cursor, end: opts.dayEndMinutes });
  return gaps;
}

/**
 * Picks the gap index a task should occupy. High/medium energy take the earliest
 * fitting gap (mornings first); low energy takes the latest fitting gap so admin
 * work drifts to the end of the day. Returns -1 if nothing fits.
 */
function pickGap(gaps: Gap[], needed: number, energy: TaskEnergy): number {
  const fits = (g: Gap) => g.end - g.start >= needed;
  if (energy === "low") {
    for (let i = gaps.length - 1; i >= 0; i--) if (fits(gaps[i])) return i;
    return -1;
  }
  for (let i = 0; i < gaps.length; i++) if (fits(gaps[i])) return i;
  return -1;
}

/**
 * Builds a schedule. Tasks are placed in priority order; within a task, energy
 * decides which fitting gap is chosen. Deterministic: identical inputs always
 * yield an identical plan.
 */
export function buildSchedule(
  tasks: SchedulableTask[],
  fixed: FixedInterval[],
  options: Partial<SchedulerOptions> = {},
): ScheduleResult {
  const opts = { ...DEFAULT_SCHEDULER_OPTIONS, ...options };
  const gaps = computeGaps(fixed, opts);

  // Highest priority first; ties broken by energy (high before low) then title
  // so the ordering is fully determined.
  const ordered = [...tasks].sort(
    (a, b) =>
      b.priority - a.priority ||
      ENERGY_RANK[a.energy] - ENERGY_RANK[b.energy] ||
      a.title.localeCompare(b.title),
  );

  const scheduled: ScheduledTask[] = [];
  const unscheduled: SchedulableTask[] = [];

  for (const task of ordered) {
    const duration = Math.min(
      opts.maxBlockMinutes,
      Math.max(opts.minBlockMinutes, task.estimatedMinutes),
    );
    const needed = duration + opts.breakMinutes;

    // High-energy tasks first try to land inside the morning peak window.
    let gapIndex = -1;
    if (task.energy === "high") {
      gapIndex = gaps.findIndex(
        (g) => g.start < opts.highEnergyEndMinutes && g.end - g.start >= needed,
      );
    }
    if (gapIndex === -1) gapIndex = pickGap(gaps, needed, task.energy);

    if (gapIndex === -1) {
      // Try without reserving a trailing break (end-of-day squeeze).
      gapIndex = pickGap(gaps, duration, task.energy);
      if (gapIndex === -1) {
        unscheduled.push(task);
        continue;
      }
    }

    const gap = gaps[gapIndex];
    const start = task.energy === "low" ? Math.max(gap.start, gap.end - needed) : gap.start;
    const end = start + duration;

    scheduled.push({ ...task, startMinutes: start, endMinutes: end });

    // Carve the used span (block + break) out of the gap.
    const consumedEnd = Math.min(gap.end, end + opts.breakMinutes);
    const remainingBefore = start > gap.start ? { start: gap.start, end: start } : null;
    const remainingAfter = consumedEnd < gap.end ? { start: consumedEnd, end: gap.end } : null;
    const replacement: Gap[] = [];
    if (remainingBefore) replacement.push(remainingBefore);
    if (remainingAfter) replacement.push(remainingAfter);
    gaps.splice(gapIndex, 1, ...replacement);
  }

  scheduled.sort((a, b) => a.startMinutes - b.startMinutes);
  return { scheduled, unscheduled };
}

/** minutes-from-midnight → "HH:MM:SS" (Postgres `time` literal). */
export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/** "HH:MM[:SS]" → minutes from midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
