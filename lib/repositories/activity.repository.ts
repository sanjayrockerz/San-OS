import {
  UserScopedRepository,
  type DbClient,
  type Row,
  type Insert,
} from "./base.repository";

/** activity_logs — append-only event stream (timeline + heatmap source). */
export class ActivityLogsRepository extends UserScopedRepository<"activity_logs"> {
  constructor(client: DbClient) {
    super(client, "activity_logs");
  }

  /** Most recent events first, capped at `limit`. */
  async recent(userId: string, limit = 50): Promise<Row<"activity_logs">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Row<"activity_logs">[];
  }

  /** Events within an inclusive [from, to] window — for heatmap aggregation. */
  async between(
    userId: string,
    from: string,
    to: string,
  ): Promise<Row<"activity_logs">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", from)
      .lte("occurred_at", to)
      .order("occurred_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"activity_logs">[];
  }
}

/** study_sessions — focused work blocks. */
export class StudySessionsRepository extends UserScopedRepository<"study_sessions"> {
  constructor(client: DbClient) {
    super(client, "study_sessions");
  }

  /** The currently-open session (no ended_at), if any. */
  async findActive(userId: string): Promise<Row<"study_sessions"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"study_sessions"> | null) ?? null;
  }
}

/** daily_logs — one roll-up row per user per day. */
export class DailyLogsRepository extends UserScopedRepository<"daily_logs"> {
  constructor(client: DbClient) {
    super(client, "daily_logs");
  }

  async findByDate(
    userId: string,
    logDate: string,
  ): Promise<Row<"daily_logs"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", logDate)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"daily_logs"> | null) ?? null;
  }

  async between(
    userId: string,
    from: string,
    to: string,
  ): Promise<Row<"daily_logs">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .gte("log_date", from)
      .lte("log_date", to)
      .order("log_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"daily_logs">[];
  }

  async upsertForDate(
    userId: string,
    logDate: string,
    patch: Partial<Omit<Insert<"daily_logs">, "id" | "user_id" | "log_date" | "created_at">>,
  ): Promise<Row<"daily_logs">> {
    const { data, error } = await this.query
      .upsert(
        {
          user_id: userId,
          log_date: logDate,
          updated_at: new Date().toISOString(),
          ...patch,
        },
        { onConflict: "user_id,log_date", ignoreDuplicates: false },
      )
      .select("*")
      .single();
    if (error) throw error;
    return data as Row<"daily_logs">;
  }
}
