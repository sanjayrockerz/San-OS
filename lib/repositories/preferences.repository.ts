import type { DbClient, Row } from "./base.repository";
import type { TablesInsert } from "@/types/database";

type PreferencesRow = Row<"user_preferences">;

/**
 * UserPreferencesRepository — one row per user (settings: focus mode,
 * notification toggles, quiet hours, hidden categories). Mirrors
 * UserContextRepository's single-row-per-user shape, but this is durable
 * settings, not session/resume state.
 */
export class UserPreferencesRepository {
  constructor(private readonly client: DbClient) {}

  private get query() {
    return (this.client as import("@supabase/supabase-js").SupabaseClient).from(
      "user_preferences",
    );
  }

  /** Returns the user's preferences row, or null if never created. */
  async findByUser(userId: string): Promise<PreferencesRow | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as PreferencesRow | null) ?? null;
  }

  /** Upserts the preferences row (settings form submits the full patch). */
  async upsert(
    userId: string,
    patch: Omit<
      TablesInsert<"user_preferences">,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ): Promise<PreferencesRow> {
    const { data, error } = await this.query
      .upsert(
        { user_id: userId, ...patch },
        { onConflict: "user_id", ignoreDuplicates: false },
      )
      .select("*")
      .single();
    if (error) throw error;
    return data as PreferencesRow;
  }
}
