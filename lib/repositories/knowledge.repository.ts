import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/**
 * knowledge_items — the Knowledge Vault store: notes, links, algorithms, and
 * (later) uploaded files. One row per saved resource, owned by a user. The
 * KnowledgeService owns vault business rules; this repository only reads/writes.
 */
export class KnowledgeItemsRepository extends UserScopedRepository<"knowledge_items"> {
  constructor(client: DbClient) {
    super(client, "knowledge_items");
  }

  /** A user's items of a given type, newest first. */
  async findByType(
    userId: string,
    type: string,
  ): Promise<Row<"knowledge_items">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"knowledge_items">[];
  }

  /** The user's N most recently added items (for the dashboard rail). */
  async recent(userId: string, limit = 5): Promise<Row<"knowledge_items">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Row<"knowledge_items">[];
  }
}

/**
 * knowledge_links — many-to-many edges between a knowledge item and a domain
 * entity (problem / topic / pattern / concept / iit_course). Powers the
 * "linked resources" rail on entity pages.
 */
export class KnowledgeLinksRepository extends UserScopedRepository<"knowledge_links"> {
  constructor(client: DbClient) {
    super(client, "knowledge_links");
  }

  /** Links belonging to one knowledge item. */
  async findByKnowledge(
    knowledgeId: string,
  ): Promise<Row<"knowledge_links">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("knowledge_id", knowledgeId);
    if (error) throw error;
    return (data ?? []) as Row<"knowledge_links">[];
  }

  /** Links pointing at a specific entity (e.g. all vault items for a problem). */
  async findByEntity(
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<Row<"knowledge_links">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);
    if (error) throw error;
    return (data ?? []) as Row<"knowledge_links">[];
  }
}
