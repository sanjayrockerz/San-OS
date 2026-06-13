import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/** ai_daily_briefs — one Daily Battle Plan per user per day. */
export class AiDailyBriefsRepository extends UserScopedRepository<"ai_daily_briefs"> {
  constructor(client: DbClient) {
    super(client, "ai_daily_briefs");
  }

  async findByDate(
    userId: string,
    briefDate: string,
  ): Promise<Row<"ai_daily_briefs"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("brief_date", briefDate)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"ai_daily_briefs"> | null) ?? null;
  }

  async latest(userId: string): Promise<Row<"ai_daily_briefs"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("brief_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"ai_daily_briefs"> | null) ?? null;
  }
}

/** ai_insights — structured findings the mentor surfaces. */
export class AiInsightsRepository extends UserScopedRepository<"ai_insights"> {
  constructor(client: DbClient) {
    super(client, "ai_insights");
  }

  /** Active (non-dismissed) insights, most recent first. */
  async active(userId: string): Promise<Row<"ai_insights">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("is_dismissed", false)
      .order("generated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"ai_insights">[];
  }
}
