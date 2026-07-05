import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

export class MemoryEdgesRepository extends UserScopedRepository<"memory_edges"> {
  constructor(client: DbClient) {
    super(client, "memory_edges");
  }

  /** Find all incoming and outgoing edges for an entity */
  async findEdges(
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<Row<"memory_edges">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .or(`and(source_type.eq.${entityType},source_id.eq.${entityId}),and(target_type.eq.${entityType},target_id.eq.${entityId})`)
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return (data ?? []) as Row<"memory_edges">[];
  }
}

export class MemoryNodesRepository extends UserScopedRepository<"memory_nodes"> {
  constructor(client: DbClient) {
    super(client, "memory_nodes");
  }

  async findByNameAndType(
    userId: string,
    nodeType: string,
    name: string,
  ): Promise<Row<"memory_nodes"> | null> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("node_type", nodeType)
      .ilike("name", name)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
