import { BaseService } from "./base.service";
import { EventService, EVENT_TYPES } from "./event.service";
import { getCalendarProvider, type CalendarEvent } from "@/lib/calendar/calendar-provider";
import type { Repositories } from "@/lib/repositories";

export interface SyncResult {
  pulled: number;
  pushed: number;
  errors: string[];
}

export class CalendarSyncService extends BaseService {
  private events: EventService;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
  }

  async pullFromCalendar(userId: string): Promise<SyncResult> {
    const result: SyncResult = { pulled: 0, pushed: 0, errors: [] };
    const connection = await this.repos.calendarConnections.findActive(userId);
    if (!connection) return result;

    const provider = getCalendarProvider();
    if (!provider.isConfigured()) return result;

    try {
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const events = await provider.getEvents(now.toISOString(), weekEnd.toISOString());

      for (const event of events) {
        try {
          const start = new Date(event.startTime);
          const end = new Date(event.endTime);
          const date = start.toISOString().slice(0, 10);
          const estimatedMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

          if (estimatedMinutes <= 0) continue;

          const existing = await this.repos.timeBlocks.findByDate(userId, date);
          const alreadySynced = existing.find(
            (b) => b.linked_entity_type === "calendar_event" && b.notes?.includes(event.id ?? ""),
          );
          if (alreadySynced) {
            if (alreadySynced.title !== event.title) {
              await this.repos.timeBlocks.update(alreadySynced.id, { title: event.title });
              result.pulled++;
            }
            continue;
          }

          await this.repos.timeBlocks.create({
            user_id: userId,
            title: event.title,
            domain: "personal",
            date,
            start_time: start.toISOString().substring(11, 16) as any,
            end_time: end.toISOString().substring(11, 16) as any,
            estimated_minutes: estimatedMinutes,
            auto_generated: false,
            locked: true,
            linked_entity_type: "calendar_event",
            notes: event.id ? `google_event_id:${event.id}` : null,
          });
          result.pulled++;
        } catch (e) {
          result.errors.push(`Failed to sync event "${event.title}": ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      await this.repos.calendarConnections.updateLastSync(connection.id);
      await this.repos.calendarSyncLog.create({
        user_id: userId,
        connection_id: connection.id,
        sync_type: "pull",
        status: result.errors.length > 0 ? "partial" : "completed",
        events_created: result.pulled,
        errors: result.errors.length > 0 ? JSON.parse(JSON.stringify(result.errors)) : [],
      });
    } catch (e) {
      result.errors.push(`Sync failed: ${e instanceof Error ? e.message : String(e)}`);
      const connection2 = await this.repos.calendarConnections.findActive(userId);
      await this.repos.calendarSyncLog.create({
        user_id: userId,
        connection_id: connection2?.id ?? null,
        sync_type: "pull",
        status: "failed",
        errors: JSON.parse(JSON.stringify(result.errors)),
      });
    }

    this.events.emit(userId, {
      eventType: EVENT_TYPES.CalendarSynced,
      entityType: "calendar",
      entityId: connection?.id ?? "",
      payload: { pulled: result.pulled, errors: result.errors.length },
    });

    return result;
  }

  async pushDeadlinesToCalendar(userId: string): Promise<SyncResult> {
    const result: SyncResult = { pulled: 0, pushed: 0, errors: [] };
    const connection = await this.repos.calendarConnections.findActive(userId);
    if (!connection) return result;

    const provider = getCalendarProvider();
    if (!provider.isConfigured()) return result;

    try {
      const projects = await this.repos.projects.findByUser(userId);
      for (const project of projects) {
        if (!project.deadline) continue;
        const event: CalendarEvent = {
          title: `[Deadline] ${project.title}`,
          description: project.description ?? undefined,
          startTime: new Date(project.deadline).toISOString(),
          endTime: new Date(new Date(project.deadline).getTime() + 3600000).toISOString(),
        };
        await provider.createEvent(event);
        result.pushed++;
      }

      const invoices = await this.repos.invoices.findByUser(userId);
      for (const invoice of invoices) {
        if (!invoice.due_date || invoice.status === "paid" || invoice.status === "cancelled") continue;
        const event: CalendarEvent = {
          title: `[Payment Due] ${invoice.invoice_number}`,
          description: `₹${invoice.total_amount} due from client`,
          startTime: new Date(invoice.due_date).toISOString(),
          endTime: new Date(new Date(invoice.due_date).getTime() + 3600000).toISOString(),
        };
        await provider.createEvent(event);
        result.pushed++;
      }

      const assignments = await this.repos.iitAssignments.findByUser(userId);
      for (const assignment of assignments) {
        if (!assignment.due_date || assignment.status === "submitted" || assignment.status === "graded") continue;
        const event: CalendarEvent = {
          title: `[Assignment] ${assignment.title}`,
          description: `Course assignment deadline`,
          startTime: new Date(assignment.due_date).toISOString(),
          endTime: new Date(new Date(assignment.due_date).getTime() + 3600000).toISOString(),
        };
        await provider.createEvent(event);
        result.pushed++;
      }

      await this.repos.calendarSyncLog.create({
        user_id: userId,
        connection_id: connection.id,
        sync_type: "push",
        status: "completed",
        events_created: result.pushed,
        errors: [],
      });
    } catch (e) {
      result.errors.push(`Push failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    return result;
  }

  async sync(userId: string): Promise<{ pull: SyncResult; push: SyncResult }> {
    const [pull, push] = await Promise.all([
      this.pullFromCalendar(userId),
      this.pushDeadlinesToCalendar(userId),
    ]);
    return { pull, push };
  }
}
