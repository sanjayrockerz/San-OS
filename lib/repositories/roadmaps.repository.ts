import {
  BaseRepository,
  UserScopedRepository,
  type DbClient,
  type Insert,
  type Row,
} from "./base.repository";

/**
 * roadmaps — global templates (user_id NULL) plus user-authored custom
 * roadmaps. Mirrors ProblemsRepository's "catalog or own" read model.
 */
export class RoadmapsRepository extends BaseRepository<"roadmaps"> {
  constructor(client: DbClient) {
    super(client, "roadmaps");
  }

  /** Templates plus the user's own roadmaps. */
  async listVisible(userId: string): Promise<Row<"roadmaps">[]> {
    const { data, error } = await this.query
      .select("*")
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"roadmaps">[];
  }

  async findBySlug(slug: string): Promise<Row<"roadmaps"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("slug", slug)
      .is("user_id", null)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"roadmaps"> | null) ?? null;
  }
}

/** roadmap_items — tree of sections/problems within a roadmap. */
export class RoadmapItemsRepository extends BaseRepository<"roadmap_items"> {
  constructor(client: DbClient) {
    super(client, "roadmap_items");
  }

  /** All items for a roadmap, in display order. */
  async findByRoadmap(roadmapId: string): Promise<Row<"roadmap_items">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"roadmap_items">[];
  }

  /** Items linked to a given problem — used to fan out solve updates. */
  async findByProblem(problemId: string): Promise<Row<"roadmap_items">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("problem_id", problemId);
    if (error) throw error;
    return (data ?? []) as Row<"roadmap_items">[];
  }
}

/** roadmap_progress — per-user completion of roadmap items. */
export class RoadmapProgressRepository extends UserScopedRepository<"roadmap_progress"> {
  constructor(client: DbClient) {
    super(client, "roadmap_progress");
  }

  async findByRoadmap(
    userId: string,
    roadmapId: string,
  ): Promise<Row<"roadmap_progress">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("roadmap_id", roadmapId);
    if (error) throw error;
    return (data ?? []) as Row<"roadmap_progress">[];
  }

  async findByItem(
    userId: string,
    itemId: string,
  ): Promise<Row<"roadmap_progress"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"roadmap_progress"> | null) ?? null;
  }

  /**
   * Atomic write keyed on the (user_id, item_id) unique constraint — avoids
   * the find-then-create/update race a double-click on the checkbox could
   * otherwise hit.
   */
  async upsert(values: Insert<"roadmap_progress">): Promise<Row<"roadmap_progress">> {
    const { data, error } = await this.query
      .upsert(values, { onConflict: "user_id,item_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as Row<"roadmap_progress">;
  }
}
