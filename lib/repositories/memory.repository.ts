import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/**
 * recall_grades — a structured recall test taken during a revision session
 * (pattern / algorithm / complexity / mistakes + confidence). Optional, richer
 * input alongside revision_queue's success/failure counters.
 */
export class RecallGradesRepository extends UserScopedRepository<"recall_grades"> {
  constructor(client: DbClient) {
    super(client, "recall_grades");
  }

  /** Grades for one problem, most recent first. */
  async findByProblem(
    userId: string,
    problemId: string,
    limit = 10,
  ): Promise<Row<"recall_grades">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("problem_id", problemId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Row<"recall_grades">[];
  }
}

/**
 * recall_strength — cached Model 1/3 output, one row per (user, problem).
 * Rebuilt idempotently by MemoryIntelligenceService; never hand-edited.
 */
export class RecallStrengthRepository extends UserScopedRepository<"recall_strength"> {
  constructor(client: DbClient) {
    super(client, "recall_strength");
  }

  async findByProblem(
    userId: string,
    problemId: string,
  ): Promise<Row<"recall_strength"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("problem_id", problemId)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"recall_strength"> | null) ?? null;
  }

  /** All cached scores for a user, ordered weakest-first. */
  async listForUser(userId: string): Promise<Row<"recall_strength">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("score", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"recall_strength">[];
  }

  /** Inserts or updates the cached score for one (user, problem). */
  async upsert(values: {
    user_id: string;
    problem_id: string;
    score: number;
    risk: Row<"recall_strength">["risk"];
    trend: Row<"recall_strength">["trend"];
    computed_at: string;
  }): Promise<Row<"recall_strength">> {
    const { data, error } = await this.query
      .upsert(values, { onConflict: "user_id,problem_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as Row<"recall_strength">;
  }
}

/**
 * topic_memory_health — cached Model 2 output, one row per (user,
 * entity_type, entity_id). Rebuilt idempotently by MemoryIntelligenceService.
 */
export class TopicMemoryHealthRepository extends UserScopedRepository<"topic_memory_health"> {
  constructor(client: DbClient) {
    super(client, "topic_memory_health");
  }

  async findByEntity(
    userId: string,
    entityType: "topic" | "pattern",
    entityId: string,
  ): Promise<Row<"topic_memory_health"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"topic_memory_health"> | null) ?? null;
  }

  /** All cached topic/pattern health rows for a user, weakest-first. */
  async listForUser(userId: string): Promise<Row<"topic_memory_health">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("health_score", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"topic_memory_health">[];
  }

  /** Inserts or updates the cached health row for one (user, entity). */
  async upsert(values: {
    user_id: string;
    entity_type: "topic" | "pattern";
    entity_id: string;
    health_score: number;
    status: Row<"topic_memory_health">["status"];
    trend: Row<"topic_memory_health">["trend"];
    problems_tracked: number;
    problems_at_risk: number;
    computed_at: string;
  }): Promise<Row<"topic_memory_health">> {
    const { data, error } = await this.query
      .upsert(values, { onConflict: "user_id,entity_type,entity_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as Row<"topic_memory_health">;
  }
}
