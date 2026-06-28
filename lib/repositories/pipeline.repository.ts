import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

export class PipelineEntriesRepository extends UserScopedRepository<"pipeline_entries"> {
  constructor(client: DbClient) {
    super(client, "pipeline_entries");
  }

  async findByStage(
    userId: string,
    stage: Row<"pipeline_entries">["stage"],
  ): Promise<Row<"pipeline_entries">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("stage", stage)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"pipeline_entries">[];
  }

  async findByClient(clientId: string): Promise<Row<"pipeline_entries">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"pipeline_entries">[];
  }

  async findOpen(userId: string): Promise<Row<"pipeline_entries">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .not("stage", "in", '("won","lost")')
      .order("expected_close_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"pipeline_entries">[];
  }
}
