import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { ActivityService } from "./activity.service";
import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";

type KnowledgeItem = Tables<"knowledge_items">;
type KnowledgeLink = Tables<"knowledge_links">;

/** The content kinds the vault stores. Phase 5B.1 ships text/link kinds; the
 *  file-backed kinds (image/pdf) are accepted but their upload path is deferred. */
export const KNOWLEDGE_TYPES = [
  "note",
  "youtube",
  "image",
  "pdf",
  "algorithm",
  "resource",
  "cheatsheet",
  "observation",
  "lecture",
] as const;
export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[number];

/** The domain entities a knowledge item can be attached to. */
export type LinkEntityType =
  | "problem"
  | "topic"
  | "pattern"
  | "concept"
  | "iit_course";

export interface CreateKnowledgeInput {
  type: KnowledgeType;
  title: string;
  content?: string | null;
  url?: string | null;
  storagePath?: string | null;
  tags?: string[];
  /** Optional entities to link the new item to in the same workflow. */
  links?: { entityType: LinkEntityType; entityId: string }[];
}

export interface UpdateKnowledgeInput {
  title?: string;
  content?: string | null;
  url?: string | null;
  tags?: string[];
}

/**
 * KnowledgeService — owns the Knowledge Vault workflow. Creating, updating, and
 * deleting an item are the single write paths; each fans out to the activity log
 * and the domain event bus so the timeline and dashboard stay in sync. Entity
 * links feed the knowledge graph's "linked resources" rail on entity pages.
 *
 * File uploads are out of scope for Phase 5B.1: `storagePath` is persisted when
 * supplied, but the service does not move bytes — a later phase wires the bucket.
 */
export class KnowledgeService extends BaseService {
  private readonly events: EventService;
  private readonly activity: ActivityService;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
    this.activity = new ActivityService(repos);
  }

  /** Every vault item for a user, newest first. */
  list(userId: string): Promise<KnowledgeItem[]> {
    return this.repos.knowledge.findByUser(userId);
  }

  /** A single item by id (ownership enforced by RLS). */
  get(id: string): Promise<KnowledgeItem | null> {
    return this.repos.knowledge.findById(id);
  }

  /** The N most recently added items — for the dashboard "Recent knowledge" rail. */
  recent(userId: string, limit = 5): Promise<KnowledgeItem[]> {
    return this.repos.knowledge.recent(userId, limit);
  }

  /** Vault items attached to a given domain entity (e.g. a problem page rail). */
  async forEntity(
    userId: string,
    entityType: LinkEntityType,
    entityId: string,
  ): Promise<KnowledgeItem[]> {
    const links = await this.repos.knowledgeLinks.findByEntity(
      userId,
      entityType,
      entityId,
    );
    const items = await Promise.all(
      links.map((l) => this.repos.knowledge.findById(l.knowledge_id)),
    );
    return items.filter((i): i is KnowledgeItem => i !== null);
  }

  /**
   * Creates a vault item (+ any requested entity links) and fans the result out
   * to the activity log and the event bus. Emits `knowledge.created`.
   */
  async create(
    userId: string,
    input: CreateKnowledgeInput,
  ): Promise<KnowledgeItem> {
    const item = await this.repos.knowledge.create({
      user_id: userId,
      type: input.type,
      title: input.title,
      content: input.content ?? null,
      url: input.url ?? null,
      storage_path: input.storagePath ?? null,
      tags: input.tags ?? [],
    });

    for (const link of input.links ?? []) {
      await this.link(userId, item.id, link.entityType, link.entityId);
    }

    await this.activity.log(userId, {
      type: "note_added",
      title: `Saved “${item.title}” to the vault`,
      entityType: "knowledge",
      entityId: item.id,
      metadata: { knowledgeType: item.type },
    });

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.KnowledgeCreated,
      entityType: "knowledge",
      entityId: item.id,
      payload: { title: item.title, knowledgeType: item.type },
    });

    return item;
  }

  /** Updates an item's editable fields. Emits `knowledge.updated`. */
  async update(
    userId: string,
    id: string,
    input: UpdateKnowledgeInput,
  ): Promise<KnowledgeItem> {
    const updated = await this.repos.knowledge.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    });

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.KnowledgeUpdated,
      entityType: "knowledge",
      entityId: id,
      payload: { title: updated.title },
    });

    return updated;
  }

  /** Deletes an item (links cascade in the DB). Emits `knowledge.deleted`. */
  async remove(userId: string, id: string): Promise<void> {
    const item = await this.repos.knowledge.findById(id);
    await this.repos.knowledge.delete(id);

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.KnowledgeDeleted,
      entityType: "knowledge",
      entityId: id,
      payload: { title: item?.title ?? null },
    });
  }

  /**
   * Attaches a knowledge item to a domain entity. Idempotent: an existing edge
   * is returned unchanged. Emits `knowledge.linked`.
   */
  async link(
    userId: string,
    knowledgeId: string,
    entityType: LinkEntityType,
    entityId: string,
  ): Promise<KnowledgeLink> {
    const existing = (
      await this.repos.knowledgeLinks.findByKnowledge(knowledgeId)
    ).find((l) => l.entity_type === entityType && l.entity_id === entityId);
    if (existing) return existing;

    const link = await this.repos.knowledgeLinks.create({
      user_id: userId,
      knowledge_id: knowledgeId,
      entity_type: entityType,
      entity_id: entityId,
    });

    await this.events.emit(userId, {
      eventType: EVENT_TYPES.KnowledgeLinked,
      entityType: "knowledge",
      entityId: knowledgeId,
      payload: { linkedTo: entityType, entityId },
    });

    return link;
  }
}
