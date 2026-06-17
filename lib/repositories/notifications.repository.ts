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
   * The notification already generated for a given source row, if any. Used
   * by `evaluateForUser` to avoid creating duplicates on every dashboard load
   * (the partial unique index on the table is the backstop, this is the
   * primary check-then-insert path).
   */
  async findBySource(
    userId: string,
    sourceType: Row<"notifications">["source_type"],
    sourceId: string,
  ): Promise<Row<"notifications"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .in("state", ["unread", "read", "snoozed"])
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"notifications"> | null) ?? null;
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
