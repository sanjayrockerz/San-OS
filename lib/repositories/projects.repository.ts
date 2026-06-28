import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

export class ProjectsRepository extends UserScopedRepository<"projects"> {
  constructor(client: DbClient) {
    super(client, "projects");
  }

  async findByStatus(
    userId: string,
    status: Row<"projects">["status"],
  ): Promise<Row<"projects">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"projects">[];
  }

  /** Active + planning projects approaching deadline. */
  async findUpcomingDeadlines(
    userId: string,
    withinDays = 14,
  ): Promise<Row<"projects">[]> {
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + withinDays * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .in("status", ["planning", "active", "on_hold"])
      .gte("deadline", from)
      .lte("deadline", to)
      .order("deadline", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"projects">[];
  }

  async updateActualHours(projectId: string, hours: number): Promise<void> {
    const { error } = await this.query
      .update({ actual_hours: hours, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    if (error) throw error;
  }

  async findByClient(clientId: string): Promise<Row<"projects">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"projects">[];
  }
}

export class ProjectTasksRepository extends UserScopedRepository<"project_tasks"> {
  constructor(client: DbClient) {
    super(client, "project_tasks");
  }

  async findByProject(projectId: string): Promise<Row<"project_tasks">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"project_tasks">[];
  }

  async findByStatus(
    userId: string,
    status: Row<"project_tasks">["status"],
  ): Promise<Row<"project_tasks">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"project_tasks">[];
  }

  async findOverdueTasks(userId: string): Promise<Row<"project_tasks">[]> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .lt("due_date", today)
      .not("status", "in", '("completed","cancelled")')
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"project_tasks">[];
  }

  async findUrgentByProject(projectId: string): Promise<Row<"project_tasks">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("project_id", projectId)
      .in("status", ["ready", "in_progress", "review"])
      .in("priority", ["critical", "high"])
      .order("priority", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"project_tasks">[];
  }
}

export class ProjectMilestonesRepository extends UserScopedRepository<"project_milestones"> {
  constructor(client: DbClient) {
    super(client, "project_milestones");
  }

  async findByProject(projectId: string): Promise<Row<"project_milestones">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("project_id", projectId)
      .order("target_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"project_milestones">[];
  }

  async findUpcomingForUser(
    userId: string,
    withinDays = 14,
  ): Promise<Row<"project_milestones">[]> {
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + withinDays * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .is("completed_at", null)
      .gte("target_date", from)
      .lte("target_date", to)
      .order("target_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"project_milestones">[];
  }
}

export class ProjectTimeEntriesRepository extends UserScopedRepository<"project_time_entries"> {
  constructor(client: DbClient) {
    super(client, "project_time_entries");
  }

  async findByProject(projectId: string): Promise<Row<"project_time_entries">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("project_id", projectId)
      .order("logged_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"project_time_entries">[];
  }

  async totalMinutesByProject(projectId: string): Promise<number> {
    const { data, error } = await this.query
      .select("minutes")
      .eq("project_id", projectId);
    if (error) throw error;
    return (data ?? []).reduce((sum, r) => sum + ((r as Row<"project_time_entries">).minutes ?? 0), 0);
  }

  async minutesByCategory(
    projectId: string,
  ): Promise<Record<string, number>> {
    const { data, error } = await this.query
      .select("category, minutes")
      .eq("project_id", projectId);
    if (error) throw error;
    const result: Record<string, number> = {};
    for (const row of (data ?? []) as Row<"project_time_entries">[]) {
      result[row.category] = (result[row.category] ?? 0) + row.minutes;
    }
    return result;
  }
}

export class ProjectDocumentsRepository extends UserScopedRepository<"project_documents"> {
  constructor(client: DbClient) {
    super(client, "project_documents");
  }

  async findByProject(projectId: string): Promise<Row<"project_documents">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"project_documents">[];
  }
}

export class ProjectChangeRequestsRepository extends UserScopedRepository<"project_change_requests"> {
  constructor(client: DbClient) {
    super(client, "project_change_requests");
  }

  async findByProject(projectId: string): Promise<Row<"project_change_requests">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"project_change_requests">[];
  }
}

export class ProjectQuotesRepository extends UserScopedRepository<"project_quotes"> {
  constructor(client: DbClient) {
    super(client, "project_quotes");
  }

  async findByProject(projectId: string): Promise<Row<"project_quotes">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"project_quotes">[];
  }

  async findByClient(clientId: string): Promise<Row<"project_quotes">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"project_quotes">[];
  }
}
