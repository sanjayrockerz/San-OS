import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

export class ResourcesRepository extends UserScopedRepository<"resources"> {
  constructor(client: DbClient) {
    super(client, "resources");
  }

  async findRecent(userId: string, limit = 50): Promise<Row<"resources">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Row<"resources">[];
  }
}

export class ResourceLinksRepository extends UserScopedRepository<"resource_links"> {
  constructor(client: DbClient) {
    // resource_links relies on the resource for RLS, but we scope our queries by resource ownership natively where possible.
    // Base repository expects a user_id for strict scoping, but resource_links doesn't have a user_id column.
    super(client, "resource_links");
  }

  /** Override generic find methods since this table lacks user_id */
  override async findById(id: string): Promise<Row<"resource_links"> | null> {
    const { data, error } = await this.query.select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as Row<"resource_links"> | null) ?? null;
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<(Row<"resource_links"> & { resources: Row<"resources"> })[]> {
    // Fetch links with their embedded resources
    const { data, error } = await this.query
      .select("*, resources(*)")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as any[];
  }
}
