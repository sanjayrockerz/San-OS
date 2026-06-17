import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { IITClient } from "@/components/iit/iit-client";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

export default async function IITWorkspacePage() {
  const { user, services } = await requireContext("/iit-workspace");

  const now = new Date().toISOString();
  const [courses, credits, upcomingAssignments] = await Promise.all([
    safe(services.iit.courses(user.id), []),
    safe(services.iit.creditSummary(user.id), { totalCredits: 0, completedCredits: 0, inProgressCredits: 0 }),
    safe(services.repos.iitAssignments.upcoming(user.id, now.slice(0, 10)), []),
  ]);

  const courseViews = await Promise.all(
    courses.map(async (c) => {
      const [assignments, lectures] = await Promise.all([
        safe(services.repos.iitAssignments.findByCourse(c.id), []),
        safe(services.repos.iitLectures.findByCourse(c.id), []),
      ]);
      const completedAssignments = assignments.filter(
        (a) => a.status === "submitted" || a.status === "graded",
      ).length;
      const watchedLectures = lectures.filter((l) => l.status === "completed").length;
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        credits: c.credits,
        semester: c.semester,
        status: c.status,
        instructor: c.instructor,
        grade: c.grade,
        marks: c.marks,
        maxMarks: c.max_marks,
        totalAssignments: assignments.length,
        completedAssignments,
        totalLectures: lectures.length,
        watchedLectures,
        progress:
          lectures.length > 0
            ? Math.round((watchedLectures / lectures.length) * 100)
            : 0,
        nextDue: assignments
          .filter((a) => a.status === "pending" && a.due_date)
          .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))[0] ?? null,
      };
    }),
  );

  const nowMs = new Date().getTime();
  const deadlines = upcomingAssignments.slice(0, 8).map((a) => {
    const dueDate = a.due_date ? new Date(a.due_date) : null;
    const daysUntil = dueDate
      ? Math.ceil((dueDate.getTime() - nowMs) / 86400000)
      : null;
    return {
      id: a.id,
      title: a.title,
      courseId: a.course_id,
      courseName:
        courses.find((c) => c.id === a.course_id)?.name ?? "Unknown",
      dueDate: dueDate?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? null,
      urgent: daysUntil !== null && daysUntil <= 3,
      daysUntil,
    };
  });

  return (
    <PageTransition>
      <PageHeader
        title="IIT Workspace"
        description="Your BS degree, organized. Courses, lectures and deadlines beside your DSA prep."
      />
      <IITClient
        courses={courseViews}
        deadlines={deadlines}
        credits={credits}
        />
    </PageTransition>
  );
}
