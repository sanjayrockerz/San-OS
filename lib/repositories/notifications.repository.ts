import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/**
 * notifications — the persistent Notification Center log. Rows are generated
 * by HabitEngineService from reminders / revision_queue / iit_assignments and
 * stay visible until the user resolves them (snooze/complete) or they expire.
 */
export class NotificationsRepository extends UserScopedRepository<"notifications"> {
  constructor(client: DbClient) {
    super(client, "notifications");
  }

  /**
   * Returns the set of `source_id`s that already have an active notification,
   * in one query instead of one per candidate row. Used by
   * `HabitEngineService.evaluateForUser`, which runs on every
   * overview/notifications page load.
   */
  async findExistingSourceIds(
    userId: string,
    sourceType: Row<"notifications">["source_type"],
    sourceIds: string[],
  ): Promise<Set<string>> {
    if (sourceIds.length === 0) return new Set();
    const { data, error } = await this.query
      .select("source_id")
      .eq("user_id", userId)
      .eq("source_type", sourceType)
      .in("source_id", sourceIds)
      .in("state", ["unread", "read", "snoozed"]);
    if (error) throw error;
    return new Set((data ?? []).map((row) => row.source_id as string));
  }

  /** Batched state transition for multiple notifications in one query. */
  async updateManyState(
    ids: string[],
    state: Row<"notifications">["state"],
  ): Promise<number> {
    return this.updateMany(ids, { state });
  }

  /** Applies the same partial update to multiple notifications in one query. */
  async updateMany(
    ids: string[],
    values: Partial<Row<"notifications">>,
  ): Promise<number> {
    if (ids.length === 0) return 0;
    const { error } = await this.query.update(values).in("id", ids);
    if (error) throw error;
    return ids.length;
  }

  async findByState(
    userId: string,
    state: Row<"notifications">["state"],
  ): Promise<Row<"notifications">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("state", state)
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"notifications">[];
  }

  async unreadCount(userId: string): Promise<number> {
    const { count, error } = await this.query
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("state", "unread");
    if (error) throw error;
    return count ?? 0;
  }

  /** Unread/read notifications past their due date — the Missed Work Queue source. */
  async findOverdue(userId: string, asOf: string): Promise<Row<"notifications">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .in("state", ["unread", "read"])
      .not("due_at", "is", null)
      .lte("due_at", asOf)
      .order("due_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"notifications">[];
  }
}
