import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables & string;

export type Row<T extends TableName> = Tables[T]["Row"];
export type Insert<T extends TableName> = Tables[T]["Insert"];
export type Update<T extends TableName> = Tables[T]["Update"];

export type DbClient = SupabaseClient<Database>;

/**
 * Generic, table-agnostic data-access base class.
 *
 * Concrete repositories (added in later phases under `lib/repositories/`)
 * extend this and bind a single table, e.g.
 *
 *   class ProblemsRepository extends BaseRepository<"problems"> {
 *     constructor(client: DbClient) { super(client, "problems"); }
 *   }
 *
 * It deliberately contains NO domain logic — it is pure infrastructure so the
 * repository/service split stays clean. Services compose repositories and hold
 * business rules; repositories only touch the database.
 *
 * The Supabase client is injected (server, browser, or admin) so the same
 * repository works in every context while RLS is enforced by whichever key the
 * client carries.
 */
export abstract class BaseRepository<T extends TableName> {
  protected constructor(
    protected readonly client: DbClient,
    protected readonly table: T,
  ) {}

  /** Returns a single row by primary key, or `null` if not found. */
  async findById(id: string): Promise<Row<T> | null> {
    const { data, error } = await this.client
      .from(this.table)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Row<T> | null;
  }

  /** Returns all rows the current RLS context is allowed to read. */
  async findAll(): Promise<Row<T>[]> {
    const { data, error } = await this.client.from(this.table).select("*");
    if (error) throw error;
    return (data ?? []) as Row<T>[];
  }

  /** Inserts a row and returns it. */
  async create(values: Insert<T>): Promise<Row<T>> {
    const { data, error } = await this.client
      .from(this.table)
      // Supabase's generated insert types are invariant across table unions;
      // the cast keeps the public API ergonomic without weakening callers.
      .insert(values as never)
      .select("*")
      .single();
    if (error) throw error;
    return data as Row<T>;
  }

  /** Updates a row by primary key and returns the updated row. */
  async update(id: string, values: Update<T>): Promise<Row<T>> {
    const { data, error } = await this.client
      .from(this.table)
      .update(values as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Row<T>;
  }

  /** Deletes a row by primary key. */
  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.table)
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}
