import {
  BaseRepository,
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/**
 * problems — shared catalog (user_id NULL) plus user-authored rows. Extends the
 * plain BaseRepository because reads legitimately span catalog + own rows
 * (RLS enforces "catalog or own"); use the dedicated helpers for owner scoping.
 */
export class ProblemsRepository extends BaseRepository<"problems"> {
  constructor(client: DbClient) {
    super(client, "problems");
  }

  /** Catalog rows (user_id IS NULL) plus the given user's authored rows. */
  async listVisible(userId: string): Promise<Row<"problems">[]> {
    const { data, error } = await this.query
      .select("*")
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"problems">[];
  }

  async findByTopic(topicId: string): Promise<Row<"problems">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("topic_id", topicId);
    if (error) throw error;
    return (data ?? []) as Row<"problems">[];
  }
}

/** problem_attempts — one row per attempt at a problem. */
export class ProblemAttemptsRepository extends UserScopedRepository<"problem_attempts"> {
  constructor(client: DbClient) {
    super(client, "problem_attempts");
  }

  /** A user's attempts for one problem, newest first (its timeline). */
  async findByProblem(
    userId: string,
    problemId: string,
  ): Promise<Row<"problem_attempts">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("problem_id", problemId)
      .order("attempted_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"problem_attempts">[];
  }
}

/** problem_reflections — narrative notes attached to a problem/attempt. */
export class ProblemReflectionsRepository extends UserScopedRepository<"problem_reflections"> {
  constructor(client: DbClient) {
    super(client, "problem_reflections");
  }

  async findByProblem(
    userId: string,
    problemId: string,
  ): Promise<Row<"problem_reflections">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("problem_id", problemId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"problem_reflections">[];
  }
}

/** problem_code_versions — multiple saved code drafts per problem. */
export class ProblemCodeVersionsRepository extends UserScopedRepository<"problem_code_versions"> {
  constructor(client: DbClient) {
    super(client, "problem_code_versions");
  }

  async findByProblem(
    userId: string,
    problemId: string,
  ): Promise<Row<"problem_code_versions">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("problem_id", problemId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"problem_code_versions">[];
  }
}
