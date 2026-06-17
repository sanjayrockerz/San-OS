import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/** concept_notes — knowledge/concept vault cards (user-owned). */
export class ConceptNotesRepository extends UserScopedRepository<"concept_notes"> {
  constructor(client: DbClient) {
    super(client, "concept_notes");
  }

  async findByStatus(
    userId: string,
    status: Row<"concept_notes">["status"],
  ): Promise<Row<"concept_notes">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"concept_notes">[];
  }
}

/** concept_resources — images/PDFs/links attached to a concept. */
export class ConceptResourcesRepository extends UserScopedRepository<"concept_resources"> {
  constructor(client: DbClient) {
    super(client, "concept_resources");
  }

  async findByConcept(conceptId: string): Promise<Row<"concept_resources">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("concept_id", conceptId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"concept_resources">[];
  }
}

/** concept_problems — many-to-many link between concepts and problems. */
export class ConceptProblemsRepository extends UserScopedRepository<"concept_problems"> {
  constructor(client: DbClient) {
    super(client, "concept_problems");
  }

  async findByConcept(conceptId: string): Promise<Row<"concept_problems">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("concept_id", conceptId);
    if (error) throw error;
    return (data ?? []) as Row<"concept_problems">[];
  }

  async findByProblem(problemId: string): Promise<Row<"concept_problems">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("problem_id", problemId);
    if (error) throw error;
    return (data ?? []) as Row<"concept_problems">[];
  }

  async deleteLink(conceptId: string, problemId: string): Promise<void> {
    const { error } = await this.query
      .delete()
      .eq("concept_id", conceptId)
      .eq("problem_id", problemId);
    if (error) throw error;
  }
}
