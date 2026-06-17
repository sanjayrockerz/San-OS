import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireContext } from "@/lib/server/context";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CourseDetail } from "@/components/iit/course-detail";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  const { user, services } = await requireContext(`/iit-workspace/${id}`);

  const courses = await safe(services.iit.courses(user.id), []);
  const course = courses.find((c) => c.id === id);
  if (!course) notFound();

  const [assignments, lectures] = await Promise.all([
    safe(services.repos.iitAssignments.findByCourse(id), []),
    safe(services.repos.iitLectures.findByCourse(id), []),
  ]);

  const completedAssignments = assignments.filter(
    (a) => a.status === "submitted" || a.status === "graded",
  ).length;
  const watchedLectures = lectures.filter((l) => l.status === "completed").length;
  const progress = lectures.length > 0
    ? Math.round((watchedLectures / lectures.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <Link
          href="/iit-workspace"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          {course.code && (
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {course.code}
            </p>
          )}
          <h1 className="text-xl font-bold tracking-tight">{course.name}</h1>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            {course.semester && <span>{course.semester}</span>}
            {course.instructor && <span>· {course.instructor}</span>}
            {course.credits && <span>· {course.credits} credits</span>}
            {course.grade && (
              <Badge variant="secondary" className="text-[10px]">
                Grade: {course.grade}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5 surface-card rounded-2xl p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Lecture Progress</span>
          <span className="font-semibold tabular">{watchedLectures} / {lectures.length} watched</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {completedAssignments} / {assignments.length} assignments done
        </p>
      </div>

      <CourseDetail
        courseId={id}
        assignments={assignments.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          dueDate: a.due_date,
          status: a.status,
          score: a.score,
          maxScore: a.max_score,
          submittedAt: a.submitted_at,
        }))}
        lectures={lectures.map((l) => ({
          id: l.id,
          title: l.title,
          lectureNumber: l.lecture_number,
          status: l.status,
          durationMinutes: l.duration_minutes,
          videoUrl: l.video_url,
          watchedAt: l.watched_at,
        }))}
      />
    </div>
  );
}
