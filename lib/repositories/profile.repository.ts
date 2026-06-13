import { BaseRepository, type DbClient, type Row } from "./base.repository";

/**
 * users_profile — one row per auth user. Not a UserScopedRepository because the
 * relationship is 1:1 (lookups are by user_id, returning a single row).
 */
export class UsersProfileRepository extends BaseRepository<"users_profile"> {
  constructor(client: DbClient) {
    super(client, "users_profile");
  }

  /** Returns the profile for a given auth user, or null if none exists yet. */
  async findByUserId(userId: string): Promise<Row<"users_profile"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"users_profile"> | null) ?? null;
  }
}
