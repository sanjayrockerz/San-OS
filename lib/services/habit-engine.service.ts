import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { ActivityService } from "./activity.service";
import { BaseService, isoDate } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
import { RevisionService } from "./revision.service";

type ReminderRow = Tables<"reminders">;
type NotificationRow = Tables<"notifications">;
type ReminderCategory = Tables<"reminders">["category"];
type FocusMode = Tables<"user_preferences">["default_focus_mode"];

const DAY_MS = 24 * 60 * 60 * 1000;
/** Grace window after a due date before an item counts as genuinely "missed". */
const GRACE_MS = 60 * 60 * 1000;
/** Unresolved notifications older than this age stop cluttering the center. */
const EXPIRE_AFTER_MS = 30 * DAY_MS;

export interface HabitEvaluationSummary {
  generated: number;
  expired: number;
  missed: number;
  unreadCount: number;
}

export interface MissedWorkItem {
  notificationId: string;
  sourceType: NotificationRow["source_type"];
  sourceId: string | null;
  title: string;
  category: ReminderCategory | null;
  dueAt: string | null;
  overdueDays: number;
}

export interface EveningReview {
  date: string;
  completedCount: number;
  missedCount: number;
  notes: string | null;
  streak: number;
  topMissed: MissedWorkItem[];
}

export interface FocusModeConfig {
  mode: FocusMode;
  label: string;
  prioritizeCategories: ReminderCategory[];
  hideCategories: ReminderCategory[];
  hideBattlePlanKinds?: Array<"revise" | "strengthen" | "learn" | "academic">;
}

export interface CreateReminderInput {
  title: string;
  description?: string | null;
  category: ReminderCategory;
  recurrence?: ReminderRow["recurrence"];
  intervalDays?: number | null;
  intervalWeeks?: number | null;
  intervalMonths?: number | null;
  timeOfDay?: string | null;
  scheduledAt?: string | null;
}

export type UpdateReminderInput = Partial<CreateReminderInput> & {
  status?: ReminderRow["status"];
};

/**
 * HabitEngineService — orchestration layer for SanOS Recovery Phase 1. Turns
 * three existing due-date sources (reminders, revision_queue, iit_assignments)
 * into a single persistent Notification Center, recovers missed work on
 * return visits, and assembles the Daily Brief / Evening Review / Focus Mode
 * surfaces. No cron: every read here is safe to call on every page load
 * because each write path is idempotent (check-then-insert against
 * `notifications`, advance-or-close against `reminders`).
 */
export class HabitEngineService extends BaseService {
  private readonly events: EventService;
  private readonly activity: ActivityService;
  private readonly revision: RevisionService;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
    this.activity = new ActivityService(repos);
    this.revision = new RevisionService(repos);
  }

  // ---------------------------------------------------------------------------
  // Core on-load evaluation
  // ---------------------------------------------------------------------------

  /**
   * Call once per dashboard/relevant-page load. Materialises due reminders /
   * revisions / assignments into `notifications`, reactivates snoozed items
   * whose snooze has elapsed, expires long-stale ones, and flags genuinely
   * missed work. Every sub-step is fail-soft — a behind-migration table or a
   * transient error degrades that section to zero rather than breaking the
   * page.
   */
  async evaluateForUser(userId: string): Promise<HabitEvaluationSummary> {
    const now = new Date();
    const nowIso = now.toISOString();

    const [fromReminders, fromRevision, fromAssignments, expired] =
      await Promise.all([
        safe(this.generateFromReminders(userId, nowIso), { created: 0, missed: 0 }),
        safe(this.generateFromRevisionQueue(userId, nowIso), { created: 0, missed: 0 }),
        safe(this.generateFromAssignments(userId, nowIso), { created: 0, missed: 0 }),
        safe(this.expireStale(userId, nowIso), 0),
      ]);

    await safe(this.detectStreakBreak(userId, now), false);
    const unreadCount = await safe(this.repos.notifications.unreadCount(userId), 0);

    return {
      generated: fromReminders.created + fromRevision.created + fromAssignments.created,
      expired,
      missed: fromReminders.missed + fromRevision.missed + fromAssignments.missed,
      unreadCount,
    };
  }

  private async generateFromReminders(
    userId: string,
    nowIso: string,
  ): Promise<{ created: number; missed: number }> {
    const due = await this.repos.reminders.findDue(userId, nowIso);
    const now = new Date(nowIso);
    let created = 0;
    let missed = 0;

    const existingIds = await this.repos.notifications.findExistingSourceIds(
      userId,
      "reminder",
      due.map((r) => r.id),
    );

    for (const reminder of due) {
      if (!existingIds.has(reminder.id)) {
        const dueAt = reminder.next_occurrence_at ?? reminder.scheduled_at ?? nowIso;
        await this.repos.notifications.create({
          user_id: userId,
          source_type: "reminder",
          source_id: reminder.id,
          title: reminder.title,
          body: reminder.description,
          category: reminder.category,
          due_at: dueAt,
        });
        created++;
        if (isMissed(dueAt, now) && (await this.emitMissed(userId, "reminder", reminder.id, reminder.title, dueAt))) {
          missed++;
        }
      }

      const next = advanceOccurrence(reminder, new Date(reminder.next_occurrence_at ?? nowIso));
      if (next) {
        await this.repos.reminders.update(reminder.id, { next_occurrence_at: next });
      } else {
        await this.repos.reminders.update(reminder.id, { status: "completed" });
      }
    }

    return { created, missed };
  }

  private async generateFromRevisionQueue(
    userId: string,
    nowIso: string,
  ): Promise<{ created: number; missed: number }> {
    const due = await this.revision.dueQueue(userId);
    const now = new Date(nowIso);
    let created = 0;
    let missed = 0;

    const existingIds = await this.repos.notifications.findExistingSourceIds(
      userId,
      "revision",
      due.map((item) => item.id),
    );

    for (const item of due) {
      if (existingIds.has(item.id)) continue;

      const dueAt = item.next_revision ?? nowIso;
      await this.repos.notifications.create({
        user_id: userId,
        source_type: "revision",
        source_id: item.id,
        title: "Revision due",
        body: "A problem in your spaced-repetition queue is due for review.",
        category: "learning_revision",
        due_at: dueAt,
      });
      created++;
      if (isMissed(dueAt, now) && (await this.emitMissed(userId, "revision", item.id, "Revision due", dueAt))) {
        missed++;
      }
    }

    return { created, missed };
  }

  private async generateFromAssignments(
    userId: string,
    nowIso: string,
  ): Promise<{ created: number; missed: number }> {
    const overdue = await this.repos.iitAssignments.findOverdue(userId, nowIso);
    const now = new Date(nowIso);
    let created = 0;
    let missed = 0;

    const existingIds = await this.repos.notifications.findExistingSourceIds(
      userId,
      "iit_assignment",
      overdue.map((a) => a.id),
    );

    for (const a of overdue) {
      if (existingIds.has(a.id)) continue;

      const dueAt = a.due_date ?? nowIso;
      await this.repos.notifications.create({
        user_id: userId,
        source_type: "iit_assignment",
        source_id: a.id,
        title: `Assignment due: ${a.title}`,
        body: a.description,
        category: "academic_assignments",
        due_at: dueAt,
      });
      created++;
      if (isMissed(dueAt, now) && (await this.emitMissed(userId, "iit_assignment", a.id, a.title, dueAt))) {
        missed++;
      }
    }

    return { created, missed };
  }

  private async expireStale(userId: string, nowIso: string): Promise<number> {
    await this.reactivateSnoozed(userId, nowIso);
    return this.expireOld(userId, nowIso);
  }

  private async reactivateSnoozed(userId: string, nowIso: string): Promise<number> {
    const snoozed = await this.repos.notifications.findByState(userId, "snoozed");
    const dueIds = snoozed
      .filter((n) => n.snoozed_until && n.snoozed_until <= nowIso)
      .map((n) => n.id);
    if (dueIds.length === 0) return 0;
    // Batched: one update query for all reactivated rows instead of one per row.
    await this.repos.notifications.updateMany(dueIds, {
      state: "unread",
      snoozed_until: null,
    });
    return dueIds.length;
  }

  private async expireOld(userId: string, nowIso: string): Promise<number> {
    const cutoff = new Date(new Date(nowIso).getTime() - EXPIRE_AFTER_MS).toISOString();
    const [unread, read] = await Promise.all([
      this.repos.notifications.findByState(userId, "unread"),
      this.repos.notifications.findByState(userId, "read"),
    ]);
    const expiredIds = [...unread, ...read]
      .filter((n) => n.due_at && n.due_at < cutoff)
      .map((n) => n.id);
    if (expiredIds.length === 0) return 0;
    // Batched: one update query for all expired rows instead of one per row.
    await this.repos.notifications.updateManyState(expiredIds, "expired");
    return expiredIds.length;
  }

  /** Emits `habit.streak_broken` once for a given gap day (de-duped via recent events). */
  private async detectStreakBreak(userId: string, now: Date): Promise<boolean> {
    const today = isoDate(now);
    const yesterday = isoDate(new Date(now.getTime() - DAY_MS));
    const dayBefore = isoDate(new Date(now.getTime() - 2 * DAY_MS));

    const logs = await this.repos.dailyLogs.between(userId, dayBefore, today);
    const byDate = new Map(logs.map((l) => [l.log_date, l]));
    const hadActivity = (d: string) => {
      const l = byDate.get(d);
      return !!l && ((l.problems_solved ?? 0) > 0 || (l.revisions_done ?? 0) > 0);
    };

    if (!(hadActivity(dayBefore) && !hadActivity(yesterday))) return false;

    const recentEvents = await this.events.listRecent(userId, 20);
    const alreadyEmitted = recentEvents.some(
      (e) =>
        e.event_type === EVENT_TYPES.HabitStreakBroken &&
        (e.payload as { gapDate?: string } | null)?.gapDate === yesterday,
    );
    if (alreadyEmitted) return false;

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.HabitStreakBroken,
      entityType: "streak",
      payload: { gapDate: yesterday },
    });
    return true;
  }

  private async emitMissed(
    userId: string,
    sourceType: NotificationRow["source_type"],
    sourceId: string,
    title: string,
    dueAt: string,
  ): Promise<boolean> {
    const result = await this.events.emit(userId, {
      eventType: EVENT_TYPES.HabitReminderMissed,
      entityType: sourceType,
      entityId: sourceId,
      payload: { title, dueAt },
    });
    return result !== null;
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  async getNotificationCenter(
    userId: string,
    filter?: { state?: NotificationRow["state"] },
  ): Promise<NotificationRow[]> {
    if (filter?.state) return this.repos.notifications.findByState(userId, filter.state);
    const [unread, read, snoozed] = await Promise.all([
      this.repos.notifications.findByState(userId, "unread"),
      this.repos.notifications.findByState(userId, "read"),
      this.repos.notifications.findByState(userId, "snoozed"),
    ]);
    return [...unread, ...read, ...snoozed];
  }

  async getMissedWorkQueue(userId: string): Promise<MissedWorkItem[]> {
    const now = new Date();
    const overdue = await this.repos.notifications.findOverdue(userId, now.toISOString());
    return overdue.map((n) => ({
      notificationId: n.id,
      sourceType: n.source_type,
      sourceId: n.source_id,
      title: n.title,
      category: n.category,
      dueAt: n.due_at,
      overdueDays: n.due_at
        ? Math.max(0, Math.floor((now.getTime() - new Date(n.due_at).getTime()) / DAY_MS))
        : 0,
    }));
  }

  /** Read-only end-of-day summary, distinct from the mood/notes reflection modal. */
  async getEveningReview(userId: string, date = isoDate()): Promise<EveningReview> {
    const [log, missed, recentLogs, completed] = await Promise.all([
      this.repos.dailyLogs.findByDate(userId, date),
      this.getMissedWorkQueue(userId),
      this.recentDailyLogs(userId, 60),
      this.repos.notifications.findByState(userId, "completed"),
    ]);

    const completedToday = completed.filter((n) => n.updated_at.slice(0, 10) === date).length;

    return {
      date,
      completedCount: completedToday,
      missedCount: missed.length,
      notes: log?.notes ?? null,
      streak: activeDayStreak(recentLogs, new Date()),
      topMissed: missed.slice(0, 5),
    };
  }

  private async recentDailyLogs(userId: string, days: number): Promise<Tables<"daily_logs">[]> {
    const to = new Date();
    const from = new Date(to.getTime() - days * DAY_MS);
    return this.repos.dailyLogs.between(
      userId,
      from.toISOString().slice(0, 10),
      to.toISOString().slice(0, 10),
    );
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  async createReminder(userId: string, input: CreateReminderInput): Promise<ReminderRow> {
    const recurrence = input.recurrence ?? "one_time";
    const created = await this.repos.reminders.create({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      recurrence,
      interval_days: input.intervalDays ?? null,
      interval_weeks: input.intervalWeeks ?? null,
      interval_months: input.intervalMonths ?? null,
      time_of_day: input.timeOfDay ?? null,
      scheduled_at: input.scheduledAt ?? null,
      next_occurrence_at: input.scheduledAt ?? new Date().toISOString(),
      status: "active",
    });

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.HabitReminderCreated,
      entityType: "reminder",
      entityId: created.id,
      payload: { title: created.title, category: created.category, recurrence: created.recurrence },
    });

    return created;
  }

  updateReminder(
    userId: string,
    reminderId: string,
    patch: UpdateReminderInput,
  ): Promise<ReminderRow> {
    void userId; // RLS scopes the mutation; kept for call-site symmetry with other mutations.
    return this.repos.reminders.update(reminderId, {
      title: patch.title,
      description: patch.description,
      category: patch.category,
      recurrence: patch.recurrence,
      interval_days: patch.intervalDays,
      interval_weeks: patch.intervalWeeks,
      interval_months: patch.intervalMonths,
      time_of_day: patch.timeOfDay,
      scheduled_at: patch.scheduledAt,
      status: patch.status,
    });
  }

  deleteReminder(userId: string, reminderId: string): Promise<void> {
    void userId;
    return this.repos.reminders.delete(reminderId);
  }

  async snoozeNotification(
    userId: string,
    notificationId: string,
    until: Date,
  ): Promise<NotificationRow> {
    const updated = await this.repos.notifications.update(notificationId, {
      state: "snoozed",
      snoozed_until: until.toISOString(),
    });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.HabitNotificationSnoozed,
      entityType: "notification",
      entityId: notificationId,
      payload: { until: until.toISOString() },
    });
    return updated;
  }

  async completeNotification(userId: string, notificationId: string): Promise<NotificationRow> {
    const updated = await this.repos.notifications.update(notificationId, { state: "completed" });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.HabitNotificationCompleted,
      entityType: "notification",
      entityId: notificationId,
      payload: {},
    });
    await this.activity.log(userId, {
      type: "study_session",
      title: `Completed: ${updated.title}`,
      metadata: { source: "habit_engine", notificationId },
    });
    return updated;
  }

  markRead(userId: string, notificationId: string): Promise<NotificationRow> {
    void userId;
    return this.repos.notifications.update(notificationId, { state: "read" });
  }

  // ---------------------------------------------------------------------------
  // Focus modes — static rule table, no DB
  // ---------------------------------------------------------------------------

  static getFocusModeConfig(mode: FocusMode): FocusModeConfig {
    return FOCUS_MODE_CONFIG[mode] ?? FOCUS_MODE_CONFIG.none;
  }
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function isMissed(dueAt: string | null, now: Date): boolean {
  if (!dueAt) return false;
  return now.getTime() - new Date(dueAt).getTime() > GRACE_MS;
}

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Advances a recurring reminder's next occurrence; `null` means "done, close it out". */
function advanceOccurrence(reminder: ReminderRow, from: Date): string | null {
  switch (reminder.recurrence) {
    case "daily":
      return addDays(from, 1).toISOString();
    case "weekly":
      return addDays(from, 7).toISOString();
    case "monthly": {
      const d = new Date(from);
      d.setUTCMonth(d.getUTCMonth() + 1);
      return d.toISOString();
    }
    case "custom": {
      const d = new Date(from);
      if (reminder.interval_months) d.setUTCMonth(d.getUTCMonth() + reminder.interval_months);
      if (reminder.interval_weeks) d.setUTCDate(d.getUTCDate() + reminder.interval_weeks * 7);
      if (reminder.interval_days) d.setUTCDate(d.getUTCDate() + reminder.interval_days);
      return d.toISOString();
    }
    case "one_time":
    default:
      return null;
  }
}

/** Consecutive days (ending today, or yesterday if today isn't logged yet) with activity. */
function activeDayStreak(logs: Tables<"daily_logs">[], now: Date): number {
  const active = new Set(
    logs
      .filter((l) => (l.problems_solved ?? 0) > 0 || (l.revisions_done ?? 0) > 0)
      .map((l) => l.log_date),
  );
  let streak = 0;
  const cursor = new Date(now);
  if (!active.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (active.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

const LEARNING: ReminderCategory[] = [
  "learning_dsa",
  "learning_revision",
  "learning_concepts",
  "learning_roadmaps",
];
const ACADEMIC: ReminderCategory[] = [
  "academic_iit",
  "academic_assignments",
  "academic_exams",
];
const PROJECT: ReminderCategory[] = ["project_development", "project_client_work"];
const PERSONAL: ReminderCategory[] = [
  "personal_priorities",
  "personal_relationships",
  "personal_family",
];
const HEALTH: ReminderCategory[] = ["health_sleep", "health_exercise"];
const ALL_CATEGORIES: ReminderCategory[] = [
  ...LEARNING,
  ...ACADEMIC,
  ...PROJECT,
  ...PERSONAL,
  ...HEALTH,
];

const FOCUS_MODE_CONFIG: Record<FocusMode, FocusModeConfig> = {
  work: {
    mode: "work",
    label: "Work",
    prioritizeCategories: PROJECT,
    hideCategories: [...PERSONAL, ...HEALTH],
  },
  academic: {
    mode: "academic",
    label: "Academic",
    prioritizeCategories: ACADEMIC,
    hideCategories: [...PROJECT, ...PERSONAL],
  },
  personal: {
    mode: "personal",
    label: "Personal",
    prioritizeCategories: PERSONAL,
    hideCategories: [...PROJECT, ...ACADEMIC],
  },
  family: {
    mode: "family",
    label: "Family",
    prioritizeCategories: ["personal_relationships", "personal_family"],
    hideCategories: [...PROJECT, ...ACADEMIC],
  },
  recovery: {
    mode: "recovery",
    label: "Recovery",
    prioritizeCategories: HEALTH,
    hideCategories: [...PROJECT, ...ACADEMIC, ...LEARNING],
  },
  deep_focus: {
    mode: "deep_focus",
    label: "Deep Focus",
    prioritizeCategories: ["learning_dsa", "learning_revision"],
    hideCategories: ALL_CATEGORIES.filter(
      (c) => c !== "learning_dsa" && c !== "learning_revision",
    ),
    hideBattlePlanKinds: ["academic"],
  },
  none: {
    mode: "none",
    label: "All",
    prioritizeCategories: [],
    hideCategories: [],
  },
};
