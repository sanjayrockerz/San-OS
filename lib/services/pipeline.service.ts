import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
import type {
  CreatePipelineEntryInput,
  UpdatePipelineEntryInput,
} from "@/lib/validators/business";

export class PipelineService extends BaseService {
  private readonly events: EventService;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
  }

  listForUser(userId: string): Promise<Tables<"pipeline_entries">[]> {
    return this.repos.pipelineEntries.findByUser(userId);
  }

  listOpen(userId: string): Promise<Tables<"pipeline_entries">[]> {
    return this.repos.pipelineEntries.findOpen(userId);
  }

  async create(
    userId: string,
    input: CreatePipelineEntryInput,
  ): Promise<Tables<"pipeline_entries">> {
    const entry = await this.repos.pipelineEntries.create({ ...input, user_id: userId });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.PipelineEntryCreated,
      entityType: "pipeline_entry",
      entityId: entry.id,
      payload: { title: entry.title, stage: entry.stage },
    });
    return entry;
  }

  async update(
    userId: string,
    id: string,
    input: UpdatePipelineEntryInput,
  ): Promise<Tables<"pipeline_entries">> {
    const existing = await this.repos.pipelineEntries.findById(id);
    const entry = await this.repos.pipelineEntries.update(id, input);

    if (input.stage && existing && input.stage !== existing.stage) {
      this.events.emit(userId, {
        eventType:
          input.stage === "won"
            ? EVENT_TYPES.PipelineWon
            : input.stage === "lost"
              ? EVENT_TYPES.PipelineLost
              : EVENT_TYPES.PipelineStageChanged,
        entityType: "pipeline_entry",
        entityId: id,
        payload: { from: existing.stage, to: input.stage, title: entry.title },
      });

      if (input.stage === "won") {
        const title = entry.title ?? existing.title;
        await this.repos.notifications.create({
          user_id: userId,
          source_type: "system",
          source_id: id,
          title: `Deal won: ${title}`,
          body: `Consider creating a project and sending an invoice.`,
          state: "unread",
          due_at: new Date().toISOString(),
        }).catch(() => null);
      }
    }
    return entry;
  }

  async delete(id: string): Promise<void> {
    await this.repos.pipelineEntries.delete(id);
  }

  /** Total weighted value of every open (not won/lost) pipeline entry. */
  async pipelineValue(userId: string): Promise<{ total: number; weighted: number }> {
    const open = await this.repos.pipelineEntries.findOpen(userId);
    const total = open.reduce((sum, e) => sum + (e.value_estimate ?? 0), 0);
    const weighted = open.reduce(
      (sum, e) => sum + ((e.value_estimate ?? 0) * e.probability) / 100,
      0,
    );
    return { total, weighted };
  }
}
