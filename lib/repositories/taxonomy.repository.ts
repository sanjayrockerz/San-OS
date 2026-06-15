import {
  BaseRepository,
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/**
 * Shared data access for the two evolving taxonomy tables (`topics`,
 * `patterns`). Both now carry the same ownership/lifecycle columns
 * (user_id, source, status), so the read patterns — "global seed OR my own",
 * the proposal queue, slug de-duplication — are identical. Concrete repos bind
 * the table and add table-specific ordering.
 */
abstract class TaxonomyRepository<
  T extends "topics" | "patterns",
> extends BaseRepository<T> {
  /** Active rows visible to a user: global seeds plus their own active rows. */
  async listVisible(userId: string): Promise<Row<T>[]> {
    const { data, error } = await this.query
      .select("*")
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq("status", "active")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<T>[];
  }

  /** The user's own rows awaiting approval (the proposal queue). */
  async listProposals(userId: string): Promise<Row<T>[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("status", "proposed")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<T>[];
  }

  /**
   * First non-dismissed row with this slug that the user can see — their own
   * row or a global seed. Used to avoid proposing a duplicate of something that
   * already exists.
   */
  async findVisibleBySlug(
    userId: string,
    slug: string,
  ): Promise<Row<T> | null> {
    const { data, error } = await this.query
      .select("*")
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq("slug", slug)
      .neq("status", "dismissed")
      .limit(1);
    if (error) throw error;
    return ((data ?? [])[0] as Row<T> | undefined) ?? null;
  }

  async findBySlug(slug: string): Promise<Row<T> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("slug", slug)
      .limit(1);
    if (error) throw error;
    return ((data ?? [])[0] as Row<T> | undefined) ?? null;
  }

  /**
   * The user's own row with this slug in ANY status (including 'dismissed').
   * Used before proposing so we never resurrect something the user rejected or
   * duplicate one they already have.
   */
  async findOwnBySlug(userId: string, slug: string): Promise<Row<T> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("slug", slug)
      .limit(1);
    if (error) throw error;
    return ((data ?? [])[0] as Row<T> | undefined) ?? null;
  }
}

/**
 * topics — global seed taxonomy (user_id NULL) plus each user's own evolving
 * topics. Ordered for display by order_index, then name.
 */
export class TopicsRepository extends TaxonomyRepository<"topics"> {
  constructor(client: DbClient) {
    super(client, "topics");
  }

  /** Visible topics ordered for display (order_index, then name). */
  async listOrdered(userId: string): Promise<Row<"topics">[]> {
    const { data, error } = await this.query
      .select("*")
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .eq("status", "active")
      .order("order_index", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"topics">[];
  }
}

/**
 * patterns — global seed pattern library plus each user's own evolving
 * patterns.
 */
export class PatternsRepository extends TaxonomyRepository<"patterns"> {
  constructor(client: DbClient) {
    super(client, "patterns");
  }
}

/**
 * taxonomy_usage — per-user practice signal and computed relevance score for
 * topics and patterns. One row per (user, entity_type, entity_id). Drives the
 * usage-based re-ranking of the taxonomy.
 */
export class TaxonomyUsageRepository extends UserScopedRepository<"taxonomy_usage"> {
  constructor(client: DbClient) {
    super(client, "taxonomy_usage");
  }

  /** All usage rows for a user of one entity type, highest score first. */
  async ranked(
    userId: string,
    entityType: "topic" | "pattern",
  ): Promise<Row<"taxonomy_usage">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("entity_type", entityType)
      .order("relevance_score", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"taxonomy_usage">[];
  }

  /** Every usage row for a user (both topics and patterns). */
  async listForUser(userId: string): Promise<Row<"taxonomy_usage">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []) as Row<"taxonomy_usage">[];
  }

  /**
   * Inserts or updates the usage row for one (user, entity), returning it.
   * Conflicts resolve on the (user_id, entity_type, entity_id) unique key.
   */
  async upsert(values: {
    user_id: string;
    entity_type: "topic" | "pattern";
    entity_id: string;
    usage_count: number;
    last_used_at: string | null;
    relevance_score: number;
  }): Promise<Row<"taxonomy_usage">> {
    const { data, error } = await this.query
      .upsert(values, { onConflict: "user_id,entity_type,entity_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as Row<"taxonomy_usage">;
  }
}
