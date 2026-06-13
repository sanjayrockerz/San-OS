import { BaseRepository, type DbClient, type Row } from "./base.repository";

/**
 * topics — global reference taxonomy (no user_id). Readable by all authenticated
 * users; writes are reserved for the service role (seeds).
 */
export class TopicsRepository extends BaseRepository<"topics"> {
  constructor(client: DbClient) {
    super(client, "topics");
  }

  /** Topics ordered for display (order_index, then name). */
  async listOrdered(): Promise<Row<"topics">[]> {
    const { data, error } = await this.query
      .select("*")
      .order("order_index", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"topics">[];
  }

  async findBySlug(slug: string): Promise<Row<"topics"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"topics"> | null) ?? null;
  }
}

/**
 * patterns — global reference taxonomy (no user_id). Pattern library cards.
 */
export class PatternsRepository extends BaseRepository<"patterns"> {
  constructor(client: DbClient) {
    super(client, "patterns");
  }

  async findBySlug(slug: string): Promise<Row<"patterns"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Row<"patterns"> | null) ?? null;
  }
}
