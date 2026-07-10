import { BaseRepository, type DbClient } from "./base.repository";
import type { Tables, TablesInsert } from "@/types/database";

type CalendarConnection = Tables<"calendar_connections">;
type CalendarSyncLog = Tables<"calendar_sync_log">;

export class CalendarConnectionsRepository extends BaseRepository<"calendar_connections"> {
  constructor(client: DbClient) {
    super(client, "calendar_connections");
  }

  async findByUser(userId: string): Promise<CalendarConnection[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as CalendarConnection[];
  }

  async findActive(userId: string): Promise<CalendarConnection | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("sync_enabled", true)
      .maybeSingle();
    if (error) throw error;
    return data as CalendarConnection | null;
  }

  async upsertTokens(
    userId: string,
    provider: string,
    tokens: { access_token?: string; refresh_token?: string; expires_at?: string; email?: string },
  ): Promise<CalendarConnection> {
    const existing = await this.findActive(userId);
    if (existing) {
      return this.update(existing.id, {
        access_token: tokens.access_token ?? existing.access_token,
        refresh_token: tokens.refresh_token ?? existing.refresh_token,
        token_expires_at: tokens.expires_at ? new Date(tokens.expires_at).toISOString() : existing.token_expires_at,
        email: tokens.email ?? existing.email,
        updated_at: new Date().toISOString(),
      });
    }
    return this.create({
      user_id: userId,
      provider,
      access_token: tokens.access_token ?? null,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: tokens.expires_at ?? null,
      email: tokens.email ?? null,
    });
  }

  async updateLastSync(id: string): Promise<void> {
    await this.update(id, { last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }
}

export class CalendarSyncLogRepository extends BaseRepository<"calendar_sync_log"> {
  constructor(client: DbClient) {
    super(client, "calendar_sync_log");
  }

  async recent(userId: string, limit = 10): Promise<CalendarSyncLog[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as CalendarSyncLog[];
  }
}
