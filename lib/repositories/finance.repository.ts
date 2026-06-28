import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

export class IncomeEntriesRepository extends UserScopedRepository<"income_entries"> {
  constructor(client: DbClient) {
    super(client, "income_entries");
  }

  async between(
    userId: string,
    fromDate: string,
    toDate: string,
  ): Promise<Row<"income_entries">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .gte("received_at", fromDate)
      .lte("received_at", toDate)
      .order("received_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"income_entries">[];
  }
}

export class ExpenseEntriesRepository extends UserScopedRepository<"expense_entries"> {
  constructor(client: DbClient) {
    super(client, "expense_entries");
  }

  async between(
    userId: string,
    fromDate: string,
    toDate: string,
  ): Promise<Row<"expense_entries">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_at", fromDate)
      .lte("occurred_at", toDate)
      .order("occurred_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"expense_entries">[];
  }
}
