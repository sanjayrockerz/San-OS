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
      case EVENT_TYPES.RevisionSnoozed:
        text = `Snoozed ${named} for revision`;
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
      case EVENT_TYPES.TaxonomyApproved:
        text = title ? `Approved “${title}”` : "Approved a taxonomy proposal";
        break;
      case EVENT_TYPES.KnowledgeCreated:
        text = title ? `Saved “${title}” to the vault` : "Saved a vault item";
        break;
      case EVENT_TYPES.KnowledgeUpdated:
        text = title ? `Updated “${title}”` : "Updated a vault item";
        break;
      case EVENT_TYPES.KnowledgeDeleted:
        text = title ? `Removed “${title}” from the vault` : "Removed a vault item";
        break;
      case EVENT_TYPES.BattlePlanTaskCompleted:
        text = title ? `Completed: ${title}` : "Completed a battle-plan task";
        break;
      case EVENT_TYPES.AuthLogin:
        text = "Signed in";
        break;
      case EVENT_TYPES.AuthLogout:
        text = "Signed out";
        break;

      // Project OS
      case EVENT_TYPES.ProjectCreated:
        text = title ? `Created project "${title}"` : "Created a project";
        href = e.entity_id ? `/projects/${e.entity_id}` : "/projects";
        break;
      case EVENT_TYPES.ProjectUpdated:
        text = title ? `Updated project "${title}"` : "Updated a project";
        href = e.entity_id ? `/projects/${e.entity_id}` : "/projects";
        break;
      case EVENT_TYPES.ProjectArchived:
        text = title ? `Archived project "${title}"` : "Archived a project";
        href = "/projects";
        break;
      case EVENT_TYPES.ProjectTaskCreated:
        text = title ? `Added task "${title}"` : "Added a project task";
        href = e.entity_id ? `/projects/${e.entity_id}` : "/projects";
        break;
      case EVENT_TYPES.ProjectTaskCompleted:
        text = title ? `Completed task "${title}"` : "Completed a project task";
        href = e.entity_id ? `/projects/${e.entity_id}` : "/projects";
        break;
      case EVENT_TYPES.ProjectMilestoneCompleted:
        text = title ? `Reached milestone "${title}"` : "Completed a milestone";
        href = e.entity_id ? `/projects/${e.entity_id}` : "/projects";
        break;
      case EVENT_TYPES.ProjectTimeLogged:
        text = title ? `Logged time on "${title}"` : "Logged project time";
        href = e.entity_id ? `/projects/${e.entity_id}` : "/projects";
        break;

      // Business OS — Clients
      case EVENT_TYPES.ClientCreated:
        text = title ? `Added client "${title}"` : "Added a new client";
        href = e.entity_id ? `/clients/${e.entity_id}` : "/clients";
        break;
      case EVENT_TYPES.ClientUpdated:
        text = title ? `Updated client "${title}"` : "Updated a client";
        href = e.entity_id ? `/clients/${e.entity_id}` : "/clients";
        break;
      case EVENT_TYPES.ClientArchived:
        text = title ? `Archived client "${title}"` : "Archived a client";
        href = "/clients";
        break;

      // Business OS — Pipeline
      case EVENT_TYPES.PipelineEntryCreated:
        text = title ? `Added deal "${title}" to pipeline` : "Added a deal to pipeline";
        href = "/pipeline";
        break;
      case EVENT_TYPES.PipelineStageChanged:
        text = title ? `Advanced "${title}" in pipeline` : "Advanced a pipeline deal";
        href = "/pipeline";
        break;
      case EVENT_TYPES.PipelineWon:
        text = title ? `Won deal: "${title}"` : "Won a deal";
        href = "/pipeline";
        break;
      case EVENT_TYPES.PipelineLost:
        text = title ? `Lost deal: "${title}"` : "Lost a deal";
        href = "/pipeline";
        break;

      // Business OS — Invoices & Finance
      case EVENT_TYPES.InvoiceCreated:
        text = title ? `Created invoice "${title}"` : "Created an invoice";
        href = "/invoices";
        break;
      case EVENT_TYPES.InvoiceSent:
        text = title ? `Sent invoice "${title}"` : "Sent an invoice";
        href = "/invoices";
        break;
      case EVENT_TYPES.InvoicePaid:
        text = title ? `Invoice "${title}" marked paid` : "Invoice marked paid";
        href = "/invoices";
        break;
      case EVENT_TYPES.InvoiceOverdue:
        text = title ? `Invoice "${title}" is overdue` : "An invoice is overdue";
        href = "/invoices";
        break;
      case EVENT_TYPES.InvoiceCancelled:
        text = title ? `Cancelled invoice "${title}"` : "Cancelled an invoice";
        href = "/invoices";
        break;
      case EVENT_TYPES.QuoteConverted:
        text = title ? `Converted quote "${title}" to invoice` : "Converted a quote to invoice";
        href = "/invoices";
        break;
      case EVENT_TYPES.RevenueRecorded:
        text = title ? `Revenue recorded from "${title}"` : "Revenue recorded";
        href = "/finance";
        break;

      default:
        text = e.event_type.replace(/[._]/g, " ");
    }

    // href fallback by entity type (for events that set text but not href above)
    if (!href) {
      if (e.entity_type === "problem" && e.entity_id) {
        href = `/problems/${e.entity_id}`;
      } else if (e.entity_type === "concept" && e.entity_id) {
        href = `/concepts/${e.entity_id}`;
      } else if (e.entity_type === "knowledge") {
        href = "/vault";
      } else if (e.event_type === EVENT_TYPES.TaxonomyApproved) {
        href = "/taxonomy";
      }
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
