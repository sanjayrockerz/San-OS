import type { Repositories } from "@/lib/repositories";
import { BaseService, isoDate } from "./base.service";
import { parseBrainDump, type ParsedCaptureItem } from "@/lib/execution/brain-dump";
import { scorePriority, byPriority, type PriorityDomain } from "@/lib/execution/priority";
import type { Tables } from "@/types/database";

type TimeBlock = Tables<"time_blocks">;
type FocusSessionRow = Tables<"focus_sessions">;

/** A time block ranked by the Priority Engine, highest-first. */
export interface RankedBlock {
  block: TimeBlock;
  priority: number;
}

const VALID_DOMAINS: PriorityDomain[] = [
  "learning", "academic", "project", "business", "health", "personal", "finance",
];

function toPriorityDomain(domain: string): PriorityDomain | undefined {
  return (VALID_DOMAINS as string[]).includes(domain) ? (domain as PriorityDomain) : undefined;
}

export interface ExecutionMetrics {
  plannedMinutes: number;
  actualMinutes: number;
  deepWorkMinutes: number;
  completedBlocks: number;
  totalBlocks: number;
  completionRate: number;
  scheduleAccuracy: number;
  focusSessions: number;
  avgFocusScore: number;
  longestStreak: number;
}

export interface DailyExecutionPlan {
  blocks: TimeBlock[];
  metrics: ExecutionMetrics;
  recommendation: string;
}

export class ExecutionEngineService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async getTodayBlocks(userId: string): Promise<TimeBlock[]> {
    return this.repos.timeBlocks.findByDate(userId, isoDate());
  }

  async getTodayMetrics(userId: string): Promise<ExecutionMetrics> {
    const today = isoDate();

    const [blocks, sessions] = await Promise.all([
      this.repos.timeBlocks.findByDate(userId, today),
      this.repos.focusSessions.findToday(userId),
    ]);

    const plannedMinutes = blocks.reduce((s, b) => s + b.estimated_minutes, 0);
    const actualMinutes = blocks.reduce((s, b) => s + (b.actual_minutes ?? 0), 0)
      + sessions.reduce((s, sess) => s + (sess.actual_minutes ?? 0), 0);
    const completedBlocks = blocks.filter((b) => b.status === "completed").length;
    const totalBlocks = blocks.length;
    const completionRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
    const scheduleAccuracy = plannedMinutes > 0
      ? Math.min(100, Math.round((actualMinutes / plannedMinutes) * 100))
      : 0;
    const completedSessions = sessions.filter((s) => s.completed);
    const avgFocusScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((s, sess) => s + (sess.focus_score ?? 0), 0) / completedSessions.length)
      : 0;
    const deepWorkMinutes = completedSessions.reduce((s, sess) => s + (sess.actual_minutes ?? 0), 0);

    return {
      plannedMinutes,
      actualMinutes,
      deepWorkMinutes,
      completedBlocks,
      totalBlocks,
      completionRate,
      scheduleAccuracy,
      focusSessions: sessions.length,
      avgFocusScore,
      longestStreak: this.computeLongestStreak(blocks),
    };
  }

  private computeLongestStreak(blocks: TimeBlock[]): number {
    const sorted = [...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
    let streak = 0;
    let max = 0;
    for (const block of sorted) {
      if (block.status === "completed") {
        streak++;
        max = Math.max(max, streak);
      } else {
        streak = 0;
      }
    }
    return max;
  }

  /**
   * Brain Dump (§2): parse unstructured text into classified capture items and
   * persist each as a pending capture, tagged with its suggested destination so
   * §13 "never leave content uncategorized" holds. Returns the parse so the UI
   * can show what was detected.
   */
  async captureBrainDump(
    userId: string,
    raw: string,
  ): Promise<{ created: number; items: (ParsedCaptureItem & { captureId?: string })[] }> {
    const items = parseBrainDump(raw);
    if (items.length === 0) return { created: 0, items };

    const results = await Promise.all(
      items.map(async (item) => {
        const created = await this.repos.captureItems.create({
          user_id: userId,
          content: item.content,
          type: item.type as any, // Cast since DB type might not match immediately
          suggested_destination: item.destination,
        });

        // Auto-create domain objects based on specific types
        if (item.type === "goal") {
          // @ts-ignore
          await this.repos.goals?.create({
            user_id: userId,
            title: item.content,
            horizon: "month",
            domain: item.domain as any,
          }).catch((e: any) => console.error("Failed to auto-create goal:", e));
        } else if (item.type === "project") {
          // @ts-ignore
          await this.repos.projects?.create({
            user_id: userId,
            title: item.content,
            status: "active",
          }).catch((e: any) => console.error("Failed to auto-create project:", e));
        } else if (item.type === "event") {
          // @ts-ignore
          await this.repos.events?.create({
            user_id: userId,
            event_type: "timeline_event_captured",
            entity_type: "capture_items",
            entity_id: created.id,
            payload: { description: item.content } as any,
          }).catch((e: any) => console.error("Failed to auto-create event:", e));
        } else if (item.type === "task" || item.type === "meeting") {
          // If it looks like a task with high priority or meeting, create a time block
          if (item.priority > 60 || item.type === "meeting") {
            const today = new Date().toISOString().slice(0, 10);
            await this.repos.timeBlocks.create({
              user_id: userId,
              title: item.content,
              domain: item.domain,
              date: today,
              start_time: item.scheduledTime ?? "12:00",
              end_time: item.scheduledTime 
                ? `${String(Number(item.scheduledTime.split(":")[0]) + 1).padStart(2, "0")}:${item.scheduledTime.split(":")[1]}`
                : "13:00",
              estimated_minutes: item.estimatedMinutes,
            }).catch(e => console.error("Failed to auto-create block:", e));
          }
        } else if (item.type === "note" || item.type === "idea") {
          // Auto-route to knowledge base if learning domain
          if (item.domain === "learning") {
             await this.repos.knowledge?.create({
               user_id: userId,
               title: item.content.slice(0, 30) + (item.content.length > 30 ? "..." : ""),
               type: "Idea",
               content: item.content
             }).catch((e: any) => console.error("Failed to auto-create knowledge:", e));
          }
        }

        return { ...item, captureId: created.id };
      })
    );

    return { created: results.length, items: results };
  }

  /**
   * Ranked execution queue (§3): today's not-yet-done blocks ordered by the
   * single Priority Engine. Urgency is derived from how soon each block starts
   * relative to now; importance/effort/postponement come from the block itself.
   */
  async getRankedQueue(userId: string, now: Date = new Date()): Promise<RankedBlock[]> {
    const blocks = await this.repos.timeBlocks.findByDate(userId, isoDate(now));
    const pending = blocks.filter(
      (b) => b.status === "planned" || b.status === "in_progress" || b.status === "postponed",
    );

    const ranked = pending.map((block) => {
      const minutesUntilStart = this.minutesUntil(block.start_time, now);
      // Closer start → higher urgency; anything already due is maxed out.
      const urgency =
        minutesUntilStart <= 0 ? 100 : Math.max(0, 100 - Math.min(100, minutesUntilStart / 6));

      return {
        block,
        priority: scorePriority({
          urgency,
          importance: block.priority,
          estimatedMinutes: block.estimated_minutes,
          postponements: block.status === "postponed" ? 1 : 0,
          domain: toPriorityDomain(block.domain),
        }),
      };
    });

    return byPriority(ranked);
  }

  /** Minutes from `now` until a HH:MM[:SS] clock time today (may be negative). */
  private minutesUntil(startTime: string, now: Date): number {
    const [h, m] = startTime.split(":").map(Number);
    const target = new Date(now);
    target.setHours(h ?? 0, m ?? 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / 60000);
  }

  async startBlock(userId: string, blockId: string): Promise<TimeBlock> {
    return this.repos.timeBlocks.updateStatus(blockId, "in_progress", {
      actual_start_at: new Date().toISOString(),
    });
  }

  async completeBlock(userId: string, blockId: string, actualMinutes: number): Promise<TimeBlock> {
    const focusScore = Math.min(100, Math.round((actualMinutes / 60) * 100 + 30));
    return this.repos.timeBlocks.updateStatus(blockId, "completed", {
      actual_end_at: new Date().toISOString(),
      actual_minutes: actualMinutes,
      focus_score: focusScore,
    });
  }

  async skipBlock(blockId: string): Promise<TimeBlock> {
    return this.repos.timeBlocks.updateStatus(blockId, "skipped");
  }

  async startFocusSession(userId: string, title: string, plannedMinutes: number): Promise<FocusSessionRow> {
    return this.repos.focusSessions.create({
      user_id: userId,
      title,
      planned_minutes: plannedMinutes,
      started_at: new Date().toISOString(),
    });
  }

  async completeFocusSession(sessionId: string, actualMinutes: number, interruptions: number): Promise<FocusSessionRow> {
    const focusScore = Math.min(
      100,
      Math.max(0, Math.round(100 - interruptions * 15 + (actualMinutes >= 25 ? 20 : 0))),
    );
    return this.repos.focusSessions.complete(sessionId, actualMinutes, focusScore);
  }

  async getWeeklyExecutionReport(userId: string): Promise<{
    weeklyMetrics: ExecutionMetrics[];
    trend: "improving" | "stable" | "declining";
    topInsight: string;
  }> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);

    const blocks = await this.repos.timeBlocks.findByDateRange(
      userId,
      isoDate(weekStart),
      isoDate(now),
    );

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return isoDate(d);
    });

    const weeklyMetrics: ExecutionMetrics[] = days.map((day) => {
      const dayBlocks = blocks.filter((b) => b.date === day);
      const completed = dayBlocks.filter((b) => b.status === "completed").length;
      const total = dayBlocks.length;
      return {
        plannedMinutes: dayBlocks.reduce((s, b) => s + b.estimated_minutes, 0),
        actualMinutes: dayBlocks.reduce((s, b) => s + (b.actual_minutes ?? 0), 0),
        deepWorkMinutes: 0,
        completedBlocks: completed,
        totalBlocks: total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        scheduleAccuracy: 0,
        focusSessions: 0,
        avgFocusScore: 0,
        longestStreak: 0,
      };
    });

    const recentCompletion = weeklyMetrics.slice(-3).map((m) => m.completionRate);
    const olderCompletion = weeklyMetrics.slice(0, 3).map((m) => m.completionRate);
    const recentAvg = recentCompletion.reduce((s, v) => s + v, 0) / 3;
    const olderAvg = olderCompletion.reduce((s, v) => s + v, 0) / 3;
    const trend: "improving" | "stable" | "declining" =
      recentAvg > olderAvg + 5 ? "improving" : recentAvg < olderAvg - 5 ? "declining" : "stable";

    const topInsight =
      trend === "improving"
        ? "Your execution rate improved this week. Keep the momentum."
        : trend === "declining"
          ? "Your completion rate dropped. Review your time block estimates."
          : "Execution is consistent. Consider pushing to 80%+ completion this week.";

    return { weeklyMetrics, trend, topInsight };
  }
}
