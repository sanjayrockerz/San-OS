import {
  UserScopedRepository,
  type DbClient,
  type Row,
} from "./base.repository";

/** iit_courses — course tracker with credits and marks. */
export class IitCoursesRepository extends UserScopedRepository<"iit_courses"> {
  constructor(client: DbClient) {
    super(client, "iit_courses");
  }

  async findBySemester(
    userId: string,
    semester: string,
  ): Promise<Row<"iit_courses">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("semester", semester)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"iit_courses">[];
  }
}

/** iit_assignments — assignment tracker. */
export class IitAssignmentsRepository extends UserScopedRepository<"iit_assignments"> {
  constructor(client: DbClient) {
    super(client, "iit_assignments");
  }

  async findByCourse(courseId: string): Promise<Row<"iit_assignments">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("course_id", courseId)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"iit_assignments">[];
  }

  /** Upcoming (not-yet-graded) assignments due on or after `from`. */
  async upcoming(
    userId: string,
    from: string,
  ): Promise<Row<"iit_assignments">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .gte("due_date", from)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"iit_assignments">[];
  }
}

/** iit_lectures — lecture progress tracker. */
export class IitLecturesRepository extends UserScopedRepository<"iit_lectures"> {
  constructor(client: DbClient) {
    super(client, "iit_lectures");
  }

  async findByCourse(courseId: string): Promise<Row<"iit_lectures">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("course_id", courseId)
      .order("lecture_number", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Row<"iit_lectures">[];
  }
}

/** academic_documents — document vault (ID card, hall tickets, certs, notes). */
export class AcademicDocumentsRepository extends UserScopedRepository<"academic_documents"> {
  constructor(client: DbClient) {
    super(client, "academic_documents");
  }

  async findByType(
    userId: string,
    type: Row<"academic_documents">["type"],
  ): Promise<Row<"academic_documents">[]> {
    const { data, error } = await this.query
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Row<"academic_documents">[];
  }
}
