import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/**
 * events — the immutable domain event stream. Insert + read only; rows are
 * never updated or deleted (enforced by RLS). EventService owns emission; this
 * repository only reads/writes rows.
 */
export class EventsRepository extends UserScopedRepository<"events"> {
  constructor(client: DbClient) {
    super(client, "events");
  }

  /** Most recent events for a user, newest first. */
  async recent(userId: string, limit = 50): Promise<Row<"events">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Row<"events">[];
  }

  /** Events for a specific entity (its history), newest first. */
  async forEntity(
    userId: string,
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<Row<"events">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Row<"events">[];
  }
}
