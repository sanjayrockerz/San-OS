import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import {
  AcademicCommandCenter,
  type AcademicCommandCenterData,
} from "@/components/dashboard/academic-command-center";

export default async function AcademicPage() {
  const { user, services } = await requireContext("/academic");

  const [courseHealth, assignmentRisk, credit, gpa, actions, insights, graduationProjection] = await Promise.all([
    services.academicHealth.courseHealth(user.id).catch(() => []),
    services.academicHealth.assignmentRisk(user.id).catch(() => []),
    services.academicHealth
      .creditIntelligence(user.id)
      .catch(() => ({ earnedCredits: 0, inProgressCredits: 0, plannedCredits: 0, totalCredits: 0, status: "on_track" as const })),
    services.gpaProjection
      .projection(user.id)
      .catch(() => ({ currentGpa: null, targetGpa: null, projectedGpa: null, helping: [], hurting: [], contributions: [] })),
    services.academicCoach.actions(user.id).catch(() => []),
    services.academicCoach.insights(user.id).catch(() => []),
    services.academicPerformance.graduationProjection(user.id).catch(() => ({
      currentCgpa: null,
      projectedGraduationCgpa: null,
      targetCgpa: null,
      remainingSemesters: 0,
      remainingCredits: 0,
      requiredGpaPerRemainingSemester: null,
      maxPossibleCgpa: null,
      marginForError: null,
      confidence: null,
      explanation: "Add semesters in Academic History to see your CGPA projection.",
    })),
  ]);

  const courseNameById = new Map(courseHealth.map((c) => [c.courseId, c.name]));

  const sortedCourseHealth = [...courseHealth].sort((a, b) => a.healthScore - b.healthScore);

  const riskViews = assignmentRisk
    .filter((r) => r.riskLevel === "medium" || r.riskLevel === "high" || r.riskLevel === "critical")
    .map((r) => ({
      assignmentId: r.assignmentId,
      courseId: r.courseId,
      courseName: r.courseId ? courseNameById.get(r.courseId) ?? "Unknown course" : "Unassigned",
      title: r.title,
      riskLevel: r.riskLevel,
      reason: r.reason,
    }));

  const oneWeekAgoMs = new Date().getTime() - 7 * 86_400_000;
  const assignmentsCompleted = assignmentRisk.filter(
    (a) => a.status === "graded" && a.dueDate && new Date(a.dueDate).getTime() >= oneWeekAgoMs,
  ).length;
  const assignmentsMissed = assignmentRisk.filter((a) => a.status === "missed").length;
  const strongest = sortedCourseHealth.at(-1) ?? null;
  const weakest = sortedCourseHealth.at(0) ?? null;

  const data: AcademicCommandCenterData = {
    creditStatus: credit.status,
    courseHealth: sortedCourseHealth,
    assignmentRisk: riskViews,
    gpa: {
      currentGpa: gpa.currentGpa,
      targetGpa: gpa.targetGpa,
      projectedGpa: gpa.projectedGpa,
      helping: gpa.helping,
      hurting: gpa.hurting,
    },
    cgpa: {
      currentCgpa: graduationProjection.currentCgpa,
      projectedGraduationCgpa: graduationProjection.projectedGraduationCgpa,
      targetCgpa: graduationProjection.targetCgpa,
      requiredGpaPerRemainingSemester: graduationProjection.requiredGpaPerRemainingSemester,
      remainingSemesters: graduationProjection.remainingSemesters,
      explanation: graduationProjection.explanation,
    },
    actions,
    insights,
    weeklyReview: {
      assignmentsCompleted,
      assignmentsMissed,
      strongestCourse: strongest && strongest.healthScore > 0 ? strongest.name : null,
      weakestCourse: weakest && weakest.courseId !== strongest?.courseId ? weakest.name : null,
    },
  };

  return (
    <PageTransition>
      <PageHeader
        title="Academic Command Center"
        description="What to study today, what's at risk, and whether you're on pace for your GPA goal."
      />
      <AcademicCommandCenter data={data} />
    </PageTransition>
  );
}
