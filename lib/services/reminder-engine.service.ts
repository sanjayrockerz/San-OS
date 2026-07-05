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
}
