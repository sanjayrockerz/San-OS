import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/**
 * revision_queue — spaced-repetition scheduling state, one row per
 * (user, problem). The RevisionService owns the scheduling maths; this
 * repository only reads/writes rows.
 */
export class RevisionQueueRepository extends UserScopedRepository<"revision_queue"> {
  constructor(client: DbClient) {
    super(client, "revision_queue");
  }

  /** The user's queue entry for a problem, or null if not scheduled yet. */
  async findByProblem(
    userId: string,
    problemId: string,
  ): Promise<Row<"revision_queue"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("problem_id", problemId)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"revision_queue"> | null) ?? null;
  }

  /** Entries due for revision on or before `asOf`, soonest first. */
  async findDue(userId: string, asOf: string): Promise<Row<"revision_queue">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .lte("next_revision", asOf)
      .order("next_revision", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"revision_queue">[];
  }

  /** Entries in a given revision state (e.g. 'struggling' = weak topics). */
  async findByState(
    userId: string,
    state: Row<"revision_queue">["current_state"],
  ): Promise<Row<"revision_queue">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("current_state", state)
      .order("next_revision", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"revision_queue">[];
  }
}
