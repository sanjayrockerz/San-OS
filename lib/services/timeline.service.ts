import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";

/** A presentation-ready timeline entry with a deep link back to its entity. */
export interface TimelineItem {
  id: string;
  eventType: string;
  text: string;
  href: string | null;
  at: string;
}

function titleOf(payload: Tables<"events">["payload"]): string | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const t = (payload as Record<string, unknown>).title;
    if (typeof t === "string" && t.length > 0) return t;
  }
  return null;
}

/**
 * Turns the raw event stream into human-readable timeline items. This is the
 * single read model the dashboard/timeline consume — UI never queries event or
 * domain tables directly. Each item links back to the entity that produced it.
 */
export class TimelineService extends BaseService {
  private readonly events: EventService;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
  }

  /** Recent activity as timeline items, newest first. */
  async getUserTimeline(userId: string, limit = 30): Promise<TimelineItem[]> {
    const events = await this.events.getUserTimeline(userId, limit);
    return events.map((e) => this.toItem(e));
  }

  /** Timeline for a single entity (e.g. one problem's history). */
  async getEntityTimeline(
    userId: string,
    entityType: string,
    entityId: string,
    limit = 30,
  ): Promise<TimelineItem[]> {
    const events = await this.events.getEntityTimeline(
      userId,
      entityType,
      entityId,
      limit,
    );
    return events.map((e) => this.toItem(e));
  }

  private toItem(e: Tables<"events">): TimelineItem {
    const title = titleOf(e.payload);
    const named = title ? `“${title}”` : "a problem";

    let text: string;
    let href: string | null = null;

    switch (e.event_type) {
      case EVENT_TYPES.ProblemCreated:
        text = `Added ${named}`;
        break;
      case EVENT_TYPES.ProblemSolved:
        text = `Solved ${named}`;
        break;
      case EVENT_TYPES.ReflectionCreated:
        text = `Reflected on ${named}`;
        break;
      case EVENT_TYPES.CodeVersionCreated:
        text = `Saved a solution for ${named}`;
        break;
      case EVENT_TYPES.RevisionScheduled:
        text = `Scheduled ${named} for revision`;
        break;
      case EVENT_TYPES.RevisionSucceeded:
        text = `Revised ${named} successfully`;
        break;
      case EVENT_TYPES.RevisionFailed:
        text = `Struggled revising ${named}`;
        break;
      case EVENT_TYPES.RoadmapProgressed:
        text = `Progressed a roadmap`;
        break;
      case EVENT_TYPES.ConceptCreated:
        text = title ? `Added concept “${title}”` : "Added a concept note";
        break;
      case EVENT_TYPES.ConceptRevised:
        text = title ? `Revised concept “${title}”` : "Revised a concept";
        break;
      case EVENT_TYPES.AssignmentCreated:
        text = title ? `Added assignment “${title}”` : "Added an assignment";
        break;
      case EVENT_TYPES.AssignmentCompleted:
        text = title ? `Completed assignment “${title}”` : "Completed an assignment";
        break;
      case EVENT_TYPES.LectureWatched:
        text = title ? `Watched “${title}”` : "Watched a lecture";
        break;
      case EVENT_TYPES.DocumentUploaded:
        text = title ? `Uploaded “${title}”` : "Uploaded a document";
        break;
      case EVENT_TYPES.TaxonomyProposed:
        text = "New taxonomy suggestion awaiting review";
        break;
      case EVENT_TYPES.TaxonomyAutoAdded:
        text = "A new topic/pattern was tracked automatically";
        break;
      case EVENT_TYPES.AuthLogin:
        text = "Signed in";
        break;
      case EVENT_TYPES.AuthLogout:
        text = "Signed out";
        break;
      default:
        text = e.event_type.replace(/[._]/g, " ");
    }

    if (e.entity_type === "problem" && e.entity_id) {
      href = `/problems/${e.entity_id}`;
    } else if (e.entity_type === "concept" && e.entity_id) {
      href = `/vault/${e.entity_id}`;
    }

    return {
      id: e.id,
      eventType: e.event_type,
      text,
      href,
      at: e.created_at,
    };
  }
}
