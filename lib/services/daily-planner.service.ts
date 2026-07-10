import type { Repositories } from "@/lib/repositories";
import type { Tables, TablesInsert } from "@/types/database";

import type { PlannerProvider } from "@/lib/execution/planner-provider";
import { BaseService, isoDate } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
import { ExecutionEngineService, type ExecutionMetrics } from "./execution-engine.service";
import { GoalService } from "./goal.service";
import {
  StudentIntelligenceCoreService,
  type StudentAction,
} from "./student-intelligence-core.service";
import { parseBrainDump, type ParsedCaptureItem } from "@/lib/execution/brain-dump";
import {
  buildSchedule,
  minutesToTime,
  timeToMinutes,
  type FixedInterval,
  type SchedulableTask,
  type ScheduledTask,
  type SchedulerOptions,
  type TaskEnergy,
} from "@/lib/execution/scheduler";

type TimeBlock = Tables<"time_blocks">;
type DailyPlan = Tables<"daily_plans">;

/** Which planner phase produced/updated a plan. */
export type PlanPhase = "evening_draft" | "morning_adjust" | "afternoon_replan";

export interface DraftPlannerResult {
  date: string;
  phase: PlanPhase;
  scheduled: ScheduledTask[];
  unscheduledCount: number;
}

export interface PlannerResult {
  date: string;
  phase: PlanPhase;
  plan: DailyPlan;
  blocks: TimeBlock[];
  scheduledCount: number;
  unscheduledCount: number;
  /** Human-readable "why" line surfaced to the user (also sent as a notification). */
  message: string;
}

export interface DayReviewResult {
  review: DailyPlan;
  tomorrow: PlannerResult;
}

export interface PlannerState {
  today: DailyPlan | null;
  todayBlocks: TimeBlock[];
  tomorrow: DailyPlan | null;
  recent: DailyPlan[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** StudentAction.kind → energy required, so deep work lands in the morning peak. */
const HIGH_ENERGY_KINDS = new Set<StudentAction["kind"]>([
  "solve_new",
  "resume_problem",
  "complete_assignment",
  "review_course",
  "complete_project_task",
]);
const LOW_ENERGY_KINDS = new Set<StudentAction["kind"]>([
  "approve_taxonomy",
  "link_vault_item",
  "link_pattern",
  "review_resource",
  "collect_invoice",
  "advance_pipeline",
  "create_concept_note",
]);

/** StudentAction.source → execution domain label. */
const SOURCE_DOMAIN: Record<StudentAction["source"], string> = {
  revision: "learning",
  memory: "learning",
  knowledge: "learning",
  roadmap: "learning",
  iit: "academic",
  project: "project",
  business: "business",
  habit: "personal",
  taxonomy: "personal",
};

const DOMAIN_LABEL: Record<string, string> = {
  learning: "Learning",
  academic: "Academic",
  project: "Projects",
  business: "Business",
  health: "Health",
  personal: "Personal",
  finance: "Finance",
};

/** Max candidate tasks pulled into a single day's plan. */
const MAX_CANDIDATES = 14;

/**
 * DailyPlannerService — the AI Daily Planner & Dynamic Replanning Engine (§4).
 *
 * It owns NO ranking of its own: it composes the existing intelligence layers —
 * StudentIntelligenceCore (the cross-domain priority list, which already folds
 * in the Habit Engine's missed work and academic/project/business deadlines),
 * the Goal Engine, and pending Brain-Dump captures — into a concrete, time-boxed
 * schedule using the deterministic {@link buildSchedule} algorithm. Every phase
 * emits a domain event (feeding Timeline / Analytics / Memory) and pushes a
 * contextual "why" notification (§14).
 *
 * Four phases, all deterministic and free of external APIs:
 *   • {@link generateTomorrowPlan}   — evening draft of the next day.
 *   • {@link applyMorningAdjustment} — rebuild today from fresh signals.
 *   • {@link replanRemainder}        — intraday recovery when behind schedule.
 *   • {@link generateEndOfDayReview} — review today + draft tomorrow.
 */
export class DailyPlannerService extends BaseService implements PlannerProvider {
  readonly id = "deterministic-v1";
  private readonly events: EventService;
  private readonly execution: ExecutionEngineService;
  private readonly goals: GoalService;
  private readonly intelligence: StudentIntelligenceCoreService;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
    this.execution = new ExecutionEngineService(repos);
    this.goals = new GoalService(repos);
    this.intelligence = new StudentIntelligenceCoreService(repos);
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  async getPlannerState(userId: string, now: Date = new Date()): Promise<PlannerState> {
    const today = isoDate(now);
    const tomorrow = isoDate(new Date(now.getTime() + DAY_MS));
    const [todayPlan, tomorrowPlan, todayBlocks, recent] = await Promise.all([
      safe(this.repos.dailyPlans.findByDate(userId, today), null),
      safe(this.repos.dailyPlans.findByDate(userId, tomorrow), null),
      safe(this.repos.timeBlocks.findByDate(userId, today), []),
      safe(this.repos.dailyPlans.findRecent(userId, 7), []),
    ]);
    return { today: todayPlan, todayBlocks, tomorrow: tomorrowPlan, recent };
  }

  // ---------------------------------------------------------------------------
  // Phase 1 — evening draft of tomorrow
  // ---------------------------------------------------------------------------

  async generateTomorrowPlan(userId: string, now: Date = new Date()): Promise<PlannerResult> {
    const date = isoDate(new Date(now.getTime() + DAY_MS));
    const candidates = await this.gatherCandidates(userId);
    const draft = await this.draftSchedule(userId, date, candidates, {
      phase: "evening_draft",
    });
    const result = await this.commitSchedule(userId, draft.date, draft.scheduled, {
      phase: draft.phase,
      status: "draft",
    }, draft.unscheduledCount);

    await this.notify(
      userId,
      "Tomorrow's plan is ready",
      result.message,
    );
    return result;
  }

  // ---------------------------------------------------------------------------
  // Phase 2 — morning adjustment of today
  // ---------------------------------------------------------------------------

  async applyMorningAdjustment(userId: string, now: Date = new Date()): Promise<PlannerResult> {
    const draft = await this.draftMorningAdjustment(userId, now);
    return this.commitSchedule(userId, draft.date, draft.scheduled, {
      phase: draft.phase,
      status: "active",
    });
  }

  async draftMorningAdjustment(userId: string, now: Date = new Date()): Promise<DraftPlannerResult> {
    const date = isoDate(now);
    const candidates = await this.gatherCandidates(userId);
    return this.draftSchedule(userId, date, candidates, {
      phase: "morning_adjust",
    });
  }

  async draftFromContext(userId: string, raw: string, now: Date = new Date()): Promise<DraftPlannerResult> {
    const date = isoDate(now);
    const [existingCandidates, contextItems] = await Promise.all([
      this.gatherCandidates(userId),
      Promise.resolve(parseBrainDump(raw)),
    ]);

    const contextual = buildContextTasks(contextItems);
    if (contextual.length === 0) {
      return this.draftSchedule(userId, date, existingCandidates, {
        phase: "morning_adjust",
      });
    }

    const seen = new Set(contextual.map((task) => normaliseTaskKey(task.title)));
    const merged = [
      ...contextual,
      ...existingCandidates.filter((task) => !seen.has(normaliseTaskKey(task.title))),
    ];

    return this.draftSchedule(userId, date, merged, {
      phase: "morning_adjust",
    });
  }

  // ---------------------------------------------------------------------------
  // Phase 3 — dynamic afternoon replanning when behind
  // ---------------------------------------------------------------------------

  /**
   * Recomputes the remainder of today. Blocks already completed / in progress /
   * locked stay put; not-yet-done planner blocks are rescheduled into the time
   * left after `now`. Anything that no longer fits is deferred (marked postponed)
   * and reported so the notification can explain the trade-off.
   */
  async replanRemainder(userId: string, now: Date = new Date()): Promise<PlannerResult> {
    const date = isoDate(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const blocks = await safe(this.repos.timeBlocks.findByDate(userId, date), []);
    // Not-yet-done planner blocks become the candidate pool to re-place.
    const movable = blocks.filter(
      (b) => b.auto_generated && !b.locked && (b.status === "planned" || b.status === "postponed"),
    );
    const behindCount = movable.filter((b) => timeToMinutes(b.end_time) <= nowMinutes).length;

    const candidates: SchedulableTask[] = movable.map((b) => ({
      key: `block:${b.id}`,
      title: b.title,
      domain: b.domain,
      estimatedMinutes: b.estimated_minutes,
      priority: b.priority,
      energy: normaliseEnergy(b.energy_required),
      linkedEntityType: b.linked_entity_type,
      linkedEntityId: b.linked_entity_id,
    }));

    const draft = await this.draftSchedule(userId, date, candidates, {
      phase: "afternoon_replan",
      nowMinutes,
    });

    const result = await this.commitSchedule(userId, draft.date, draft.scheduled, {
      phase: draft.phase,
      status: "active",
      eventType: EVENT_TYPES.PlannerReplanned,
    }, draft.unscheduledCount);

    const deferred = result.unscheduledCount;
    const message =
      behindCount === 0 && deferred === 0
        ? `On track — ${result.scheduledCount} block(s) still ahead of you today.`
        : `You're behind on ${behindCount} block(s). I re-slotted ${result.scheduledCount} into the rest of today` +
          (deferred > 0 ? ` and deferred ${deferred} to keep the plan realistic.` : ".");

    await this.notify(userId, "Plan updated — you fell behind", message);
    return { ...result, message };
  }

  // ---------------------------------------------------------------------------
  // Phase 4 — end-of-day review + tomorrow draft
  // ---------------------------------------------------------------------------

  async generateEndOfDayReview(userId: string, now: Date = new Date()): Promise<DayReviewResult> {
    const date = isoDate(now);
    const [metrics, blocks] = await Promise.all([
      safe(this.execution.getTodayMetrics(userId), zeroMetrics()),
      safe(this.repos.timeBlocks.findByDate(userId, date), []),
    ]);

    const wins = blocks
      .filter((b) => b.status === "completed")
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map((b) => b.title);
    const misses = blocks
      .filter((b) => b.status === "skipped" || b.status === "postponed" || b.status === "planned")
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map((b) => b.title);

    const reviewNotes = buildReviewNotes(metrics, wins.length, misses.length);

    // Draft tomorrow first so we can name its focus in the review row.
    const tomorrow = await this.generateTomorrowPlan(userId, now);

    const review = await this.repos.dailyPlans.upsert(userId, date, {
      status: "reviewed",
      source: "afternoon_replan",
      completion_rate: metrics.completionRate,
      completed_blocks: metrics.completedBlocks,
      total_blocks: metrics.totalBlocks,
      deep_work_minutes: metrics.deepWorkMinutes,
      wins,
      misses,
      tomorrow_focus: tomorrow.plan.focus_theme,
      review_notes: reviewNotes,
      reviewed_at: new Date().toISOString(),
    });

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.PlannerDayReviewed,
      entityType: "daily_plan",
      entityId: review.id,
      payload: {
        title: `${metrics.completionRate}% complete`,
        completionRate: metrics.completionRate,
        deepWorkMinutes: metrics.deepWorkMinutes,
      },
    });

    await this.notify(
      userId,
      `Day reviewed — ${metrics.completionRate}% complete`,
      `${reviewNotes} Tomorrow's focus: ${tomorrow.plan.focus_theme ?? "open"}.`,
    );

    return { review, tomorrow };
  }

  // ---------------------------------------------------------------------------
  // Candidate gathering — compose existing engines, never re-rank.
  // ---------------------------------------------------------------------------

  private async gatherCandidates(userId: string): Promise<SchedulableTask[]> {
    const [priorities, goalSummaries, captures] = await Promise.all([
      safe(this.intelligence.priorities(userId), [] as StudentAction[]),
      safe(this.goals.getActiveSummary(userId), []),
      safe(this.repos.captureItems.findPending(userId), []),
    ]);

    const tasks: SchedulableTask[] = [];

    for (const action of priorities) {
      tasks.push({
        key: action.id,
        title: action.title,
        domain: SOURCE_DOMAIN[action.source] ?? "personal",
        estimatedMinutes: action.estimatedMinutes,
        priority: action.score,
        energy: energyForKind(action.kind),
        linkedEntityType: action.source,
        linkedEntityId: action.entityId,
      });
    }

    // Goal Engine: today's and this-week's active goals become schedulable pushes.
    for (const summary of goalSummaries) {
      if (summary.horizon !== "today" && summary.horizon !== "week") continue;
      const base = summary.horizon === "today" ? 78 : 62;
      for (const goal of summary.goals.filter((g) => g.progress < 100).slice(0, 2)) {
        tasks.push({
          key: `goal:${goal.id}`,
          title: `Advance goal: ${goal.title}`,
          domain: goal.domain,
          estimatedMinutes: 45,
          priority: base,
          energy: "medium",
          linkedEntityType: "goal",
          linkedEntityId: goal.id,
        });
      }
    }

    // Brain-Dump inbox: reuse the deterministic parser to prioritise captures.
    for (const capture of captures.filter((c) => c.type === "task" || c.type === "meeting").slice(0, 4)) {
      const parsed = parseBrainDump(capture.content)[0];
      if (!parsed) continue;
      tasks.push({
        key: `capture:${capture.id}`,
        title: capture.content,
        domain: parsed.domain,
        estimatedMinutes: parsed.estimatedMinutes,
        priority: parsed.priority,
        energy: parsed.type === "meeting" ? "medium" : energyForDomain(parsed.domain),
        linkedEntityType: "capture",
        linkedEntityId: capture.id,
      });
    }

    // Dedupe by key (highest priority wins) and cap the pool.
    const byKey = new Map<string, SchedulableTask>();
    for (const t of tasks) {
      const existing = byKey.get(t.key);
      if (!existing || t.priority > existing.priority) byKey.set(t.key, t);
    }
    return [...byKey.values()].sort((a, b) => b.priority - a.priority).slice(0, MAX_CANDIDATES);
  }

  // ---------------------------------------------------------------------------
  // Materialisation — schedule, persist blocks, upsert plan header, emit event.
  // ---------------------------------------------------------------------------

  private async draftSchedule(
    userId: string,
    date: string,
    candidates: SchedulableTask[],
    opts: {
      phase: PlanPhase;
      nowMinutes?: number | null;
    },
  ): Promise<DraftPlannerResult> {
    const fixedBlocks = await safe(this.repos.timeBlocks.findFixedByDate(userId, date), []);
    const fixed: FixedInterval[] = fixedBlocks.map((b) => ({
      startMinutes: timeToMinutes(b.start_time),
      endMinutes: timeToMinutes(b.end_time),
    }));

    const schedulerOpts: Partial<SchedulerOptions> = {
      nowMinutes: opts.nowMinutes ?? null,
    };
    const { scheduled, unscheduled } = buildSchedule(candidates, fixed, schedulerOpts);

    return {
      date,
      phase: opts.phase,
      scheduled,
      unscheduledCount: unscheduled.length,
    };
  }

  async commitSchedule(
    userId: string,
    date: string,
    scheduled: ScheduledTask[],
    opts: {
      phase: PlanPhase;
      status: DailyPlan["status"];
      eventType?: string;
    },
    unscheduledCount: number = 0,
  ): Promise<PlannerResult> {
    // Replace the planner's previous blocks for the day, then insert the new set.
    await safe(this.repos.timeBlocks.clearAutoGenerated(userId, date), undefined);

    const rows: TablesInsert<"time_blocks">[] = scheduled.map((task) => ({
      user_id: userId,
      title: task.title,
      domain: task.domain,
      date,
      start_time: minutesToTime(task.startMinutes),
      end_time: minutesToTime(task.endMinutes),
      estimated_minutes: task.endMinutes - task.startMinutes,
      energy_required: task.energy,
      priority: task.priority,
      status: "planned",
      auto_generated: true,
      plan_source: opts.phase,
      linked_entity_type: task.linkedEntityType ?? null,
      linked_entity_id: isUuid(task.linkedEntityId) ? task.linkedEntityId : null,
    }));
    const blocks = await safe(this.repos.timeBlocks.bulkCreate(rows), [] as TimeBlock[]);

    const plannedMinutes = scheduled.reduce((s, t) => s + (t.endMinutes - t.startMinutes), 0);
    const focusTheme = dominantDomain(scheduled);
    const message = buildPlanMessage(scheduled.length, plannedMinutes, focusTheme, unscheduledCount);

    const plan = await this.repos.dailyPlans.upsert(userId, date, {
      status: opts.status,
      source: opts.phase,
      focus_theme: focusTheme,
      planned_minutes: plannedMinutes,
      block_count: scheduled.length,
      summary: message,
      generated_at: new Date().toISOString(),
    });

    await this.events.emit(userId, {
      eventType: opts.eventType ?? EVENT_TYPES.PlannerPlanGenerated,
      entityType: "daily_plan",
      entityId: plan.id,
      payload: {
        title: `${scheduled.length} block(s), focus ${focusTheme ?? "open"}`,
        date,
        phase: opts.phase,
        plannedMinutes,
      },
    });
    
    // Also send the notify that used to be in applyMorningAdjustment and generateTomorrowPlan
    if (opts.phase === "morning_adjust") {
      await this.notify(userId, "Good morning — today's plan is set", message);
    } else if (opts.phase === "evening_draft") {
      await this.notify(userId, "Tomorrow's plan is ready", message);
    }

    return {
      date,
      phase: opts.phase,
      plan,
      blocks,
      scheduledCount: scheduled.length,
      unscheduledCount: unscheduledCount,
      message,
    };
  }

  private async notify(userId: string, title: string, body: string): Promise<void> {
    await safe(
      this.repos.notifications.create({
        user_id: userId,
        source_type: "system",
        source_id: null,
        title,
        body,
        category: null,
        due_at: null,
      }),
      undefined,
    );
  }
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function energyForKind(kind: StudentAction["kind"]): TaskEnergy {
  if (HIGH_ENERGY_KINDS.has(kind)) return "high";
  if (LOW_ENERGY_KINDS.has(kind)) return "low";
  return "medium";
}

function energyForDomain(domain: string): TaskEnergy {
  if (domain === "learning" || domain === "academic") return "high";
  if (domain === "personal" || domain === "finance") return "low";
  return "medium";
}

function normaliseEnergy(value: string): TaskEnergy {
  return value === "high" || value === "low" ? value : "medium";
}

function dominantDomain(tasks: { domain: string; endMinutes: number; startMinutes: number }[]): string | null {
  if (tasks.length === 0) return null;
  const totals = new Map<string, number>();
  for (const t of tasks) {
    totals.set(t.domain, (totals.get(t.domain) ?? 0) + (t.endMinutes - t.startMinutes));
  }
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? (DOMAIN_LABEL[top[0]] ?? top[0]) : null;
}

function buildPlanMessage(
  count: number,
  minutes: number,
  focus: string | null,
  unscheduled: number,
): string {
  if (count === 0) {
    return "Nothing to schedule right now — inbox is clear. Add a goal or capture a task to seed a plan.";
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const duration = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;
  const tail = unscheduled > 0 ? ` ${unscheduled} item(s) didn't fit and roll to another day.` : "";
  return `${count} block(s) · ${duration} planned${focus ? ` · focus: ${focus}` : ""}.${tail}`;
}

function buildReviewNotes(metrics: ExecutionMetrics, wins: number, misses: number): string {
  const rate = metrics.completionRate;
  const verdict =
    rate >= 80 ? "Strong day." : rate >= 50 ? "Solid, with room to tighten." : "Tough day — reset tomorrow.";
  return `${verdict} ${metrics.completedBlocks}/${metrics.totalBlocks} blocks done, ${metrics.deepWorkMinutes}m deep work. ${wins} win(s), ${misses} carried over.`;
}

function buildContextTasks(items: ParsedCaptureItem[]): SchedulableTask[] {
  return items
    .filter((item) => item.type !== "note" && item.type !== "event" && item.type !== "notification")
    .slice(0, 8)
    .map((item, index) => ({
      key: `context:${index}:${normaliseTaskKey(item.content)}`,
      title: cleanTaskTitle(item.content),
      domain: item.domain,
      estimatedMinutes: item.estimatedMinutes,
      priority: Math.max(105, 140 - index * 5),
      energy: energyForContext(item),
      preferredStartMinutes: item.scheduledTime ? timeToMinutes(`${item.scheduledTime}:00`) : null,
      preferredWindowStartMinutes: item.timeWindow?.startMinutes ?? null,
      preferredWindowEndMinutes: item.timeWindow?.endMinutes ?? null,
    }));
}

function cleanTaskTitle(raw: string): string {
  return raw
    .replace(/^\s*(?:i\s+will|i'll|we\s+will|need to|have to)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function energyForContext(item: ParsedCaptureItem): TaskEnergy {
  if (item.domain === "academic" || item.domain === "learning" || item.domain === "project") return "high";
  if (item.domain === "finance" || item.domain === "personal") return "low";
  if (/\bbreakfast|lunch|dinner|talk|call\b/i.test(item.content)) return "low";
  return item.domain === "health" ? "medium" : energyForDomain(item.domain);
}

function normaliseTaskKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function zeroMetrics(): ExecutionMetrics {
  return {
    plannedMinutes: 0,
    actualMinutes: 0,
    deepWorkMinutes: 0,
    completedBlocks: 0,
    totalBlocks: 0,
    completionRate: 0,
    scheduleAccuracy: 0,
    focusSessions: 0,
    avgFocusScore: 0,
    longestStreak: 0,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
