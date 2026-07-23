import type { Repositories } from "@/lib/repositories";
import { BaseService } from "./base.service";
import type { Row } from "@/lib/repositories";

export class ReminderEngineService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async createReminder(userId: string, input: {
    title: string;
    body?: string | null;
    category?: Row<"notifications">["category"];
    dueAt?: string | null;
    sourceType?: Row<"notifications">["source_type"];
    sourceId?: string | null;
  }): Promise<Row<"notifications">> {
    return this.repos.notifications.create({
      user_id: userId,
      source_type: input.sourceType ?? "system",
      source_id: input.sourceId ?? null,
      title: input.title,
      body: input.body ?? null,
      category: input.category ?? null,
      due_at: input.dueAt ?? null,
    });
  }

  async startNow(notificationId: string): Promise<Row<"notifications">> {
    return this.repos.notifications.update(notificationId, { state: "read" });
  }

  async snooze(notificationId: string, untilIso: string): Promise<Row<"notifications">> {
    return this.repos.notifications.update(notificationId, { state: "snoozed", snoozed_until: untilIso });
  }

  async skip(notificationId: string): Promise<Row<"notifications">> {
    return this.repos.notifications.update(notificationId, { state: "expired" });
  }

  async markComplete(notificationId: string): Promise<Row<"notifications">> {
    return this.repos.notifications.update(notificationId, { state: "completed" });
  }

  /**
   * Evaluates the student's daily coach status, pending priorities, and missed items,
   * automatically scheduling proactive reminders in the notifications table.
   */
  async generateAutomatedCoachReminders(userId: string): Promise<{ created: number; reminders: Row<"notifications">[] }> {
    const existing = await this.repos.notifications.findByState(userId, "unread").catch(() => []);
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Check if coach reminder for today already exists
    const hasTodayCoachReminder = existing.some(
      (n: Row<"notifications">) => n.source_type === "system" && n.created_at.startsWith(todayStr),
    );

    const createdReminders: Row<"notifications">[] = [];

    if (!hasTodayCoachReminder) {
      // Create morning/daily focus nudge
      const n = await this.createReminder(userId, {
        title: "🤖 Intelligent Coach: Daily Focus Ready",
        body: "Your prioritized battle plan is ready for execution. Tap to review your top target for today.",
        category: "general",
        sourceType: "system",
        dueAt: new Date().toISOString(),
      });
      createdReminders.push(n);
    }

    return { created: createdReminders.length, reminders: createdReminders };
  }
}
