import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

export class ClientsRepository extends UserScopedRepository<"clients"> {
  constructor(client: DbClient) {
    super(client, "clients");
  }

  async findByStatus(
    userId: string,
    status: Row<"clients">["status"],
  ): Promise<Row<"clients">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"clients">[];
  }
}
