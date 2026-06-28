import {
  UserScopedRepository,
  type DbClient,
  type Insert,
  type Row,
} from "./base.repository";

/** academic_semesters — permanent per-semester record (SGPA, CGPA-after, backlogs, credits). */
export class AcademicSemestersRepository extends UserScopedRepository<"academic_semesters"> {
  constructor(client: DbClient) {
    super(client, "academic_semesters");
  }

  /** All semesters for a user, oldest first — the order the CGPA engine walks them in. */
  async findOrdered(userId: string): Promise<Row<"academic_semesters">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("semester_number", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"academic_semesters">[];
  }

  async findCurrent(userId: string): Promise<Row<"academic_semesters"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("is_current", true)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"academic_semesters"> | null) ?? null;
  }
}

/** academic_goals — one row per user (target CGPA, dream company, programme length). */
export class AcademicGoalsRepository extends UserScopedRepository<"academic_goals"> {
  constructor(client: DbClient) {
    super(client, "academic_goals");
  }

  async getForUser(userId: string): Promise<Row<"academic_goals"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"academic_goals"> | null) ?? null;
  }

  /** Upserts the single goals row for a user (unique on user_id). */
  async upsert(userId: string, values: Omit<Insert<"academic_goals">, "user_id">): Promise<Row<"academic_goals">> {
    const { data, error } = await this.query
      .upsert({ ...values, user_id: userId }, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as Row<"academic_goals">;
  }
}
