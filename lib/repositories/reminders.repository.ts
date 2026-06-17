import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/**
 * reminders — user-defined one-time/recurring reminders. The HabitEngine owns
 * the recurrence maths (advancing `next_occurrence_at`); this repository only
 * reads/writes rows.
 */
export class RemindersRepository extends UserScopedRepository<"reminders"> {
  constructor(client: DbClient) {
    super(client, "reminders");
  }

  /** All active reminders for a user, regardless of due date. */
  async findActive(userId: string): Promise<Row<"reminders">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("next_occurrence_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"reminders">[];
  }

  /** Active reminders due on or before `asOf`, soonest first. */
  async findDue(userId: string, asOf: string): Promise<Row<"reminders">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .lte("next_occurrence_at", asOf)
      .order("next_occurrence_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"reminders">[];
  }

  /** All reminders for a user in a given category. */
  async findByCategory(
    userId: string,
    category: Row<"reminders">["category"],
  ): Promise<Row<"reminders">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"reminders">[];
  }
}
