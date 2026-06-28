import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

export class InvoicesRepository extends UserScopedRepository<"invoices"> {
  constructor(client: DbClient) {
    super(client, "invoices");
  }

  async findByClient(clientId: string): Promise<Row<"invoices">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"invoices">[];
  }

  async findByProject(projectId: string): Promise<Row<"invoices">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"invoices">[];
  }

  async findByStatus(
    userId: string,
    status: Row<"invoices">["status"],
  ): Promise<Row<"invoices">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"invoices">[];
  }

  /** Sent (or previously overdue) invoices whose due_date has passed and are still unpaid. */
  async findOverdue(userId: string): Promise<Row<"invoices">[]> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .in("status", ["sent", "overdue"])
      .lt("due_date", today)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"invoices">[];
  }
}
