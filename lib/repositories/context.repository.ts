import type { DbClient, Row } from "./base.repository";
import type { TablesInsert } from "@/types/database";

type ContextRow = Row<"user_context">;

/**
 * UserContextRepository — stores the lightweight "what were you doing?" row.
 * One row per user, upserted on every significant action. Reads power the
 * Context Engine and the Continue Learning panel.
 */
export class UserContextRepository {
  constructor(private readonly client: DbClient) {}

  private get query() {
    return (this.client as import("@supabase/supabase-js").SupabaseClient).from(
      "user_context",
    );
  }

  /** Returns the current context row, or null if the user has never been seen. */
  async findByUser(userId: string): Promise<ContextRow | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as ContextRow | null) ?? null;
  }

  /**
   * Upserts the context row. Call after every significant mutation so the OS
   * always knows where the user is. Fail-soft at the call site — never throw
   * from this in a server action.
   */
  async upsert(
    userId: string,
    patch: Omit<TablesInsert<"user_context">, "id" | "user_id" | "created_at" | "updated_at">,
  ): Promise<ContextRow> {
    const { data, error } = await this.query
      .upsert(
        { user_id: userId, ...patch, last_activity_at: new Date().toISOString() },
        { onConflict: "user_id", ignoreDuplicates: false },
      )
      .select("*")
      .single();
    if (error) throw error;
    return data as ContextRow;
  }
}
