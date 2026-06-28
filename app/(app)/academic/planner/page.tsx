import { Target, Sparkles, GraduationCap } from "lucide-react";

import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/page-transition";
import { CATEGORY_TEXT } from "@/lib/design/category";
import { cn } from "@/lib/utils";
import { GoalsForm } from "@/components/academic/goals-form";
import { WhatIfSimulator } from "@/components/academic/what-if-simulator";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function AcademicPlannerPage() {
  const { user, services } = await requireContext("/academic/planner");

  const [goals, projection, readiness, courses] = await Promise.all([
    safe(services.repos.academicGoals.getForUser(user.id), null),
    safe(
      services.academicPerformance.graduationProjection(user.id),
      {
        currentCgpa: null,
        projectedGraduationCgpa: null,
        targetCgpa: null,
        remainingSemesters: 0,
        remainingCredits: 0,
        requiredGpaPerRemainingSemester: null,
        maxPossibleCgpa: null,
        marginForError: null,
        confidence: null,
        explanation: "",
      },
    ),
    safe(services.placementReadiness.readiness(user.id), {
      dreamCompany: null,
      targetCgpa: null,
      currentCgpa: null,
      projectedGraduationCgpa: null,
      gap: null,
      readiness: "needs_target" as const,
      remainingSemesters: 0,
      requiredGpaPerRemainingSemester: null,
      explanation: "",
    }),
    safe(services.repos.iitCourses.findByUser(user.id), []),
  ]);

  const simulatableCourses = courses
    .filter((c) => c.status !== "dropped")
    .map((c) => ({ id: c.id, name: c.name, grade: c.grade, grade_point: c.grade_point }));

  return (
    <PageTransition>
      <PageHeader
        title="GPA Target Planner"
        description="Set your target CGPA, simulate what-if scenarios, and see exactly what it takes to graduate where you want."
      />
      <div className="space-y-5">
        <Section>
          <div className="surface-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Target className={cn("size-4.5", CATEGORY_TEXT.academic)} />
              <h2 className="text-section">Your Target</h2>
            </div>
            <GoalsForm goals={goals} />
          </div>
        </Section>

        <Section>
          <div className="surface-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className={cn("size-4.5", CATEGORY_TEXT.academic)} />
              <h2 className="text-section">Graduation Projection</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center mb-3">
              <div className="rounded-xl border border-border p-3">
                <p className="text-xl font-bold tabular">{projection.currentCgpa?.toFixed(2) ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">Current CGPA</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xl font-bold tabular">{projection.projectedGraduationCgpa?.toFixed(2) ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">Projected Graduation</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xl font-bold tabular">
                  {projection.requiredGpaPerRemainingSemester?.toFixed(2) ?? "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">Required GPA / semester</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xl font-bold tabular">{projection.maxPossibleCgpa?.toFixed(2) ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">Max Possible CGPA</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{projection.explanation}</p>
          </div>
        </Section>

        <Section>
          <div className="surface-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className={cn("size-4.5", CATEGORY_TEXT.academic)} />
              <h2 className="text-section">What-If Simulator</h2>
            </div>
            <WhatIfSimulator courses={simulatableCourses} />
          </div>
        </Section>

        <Section>
          <div className="surface-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className={cn("size-4.5", CATEGORY_TEXT.academic)} />
              <h2 className="text-section">Placement Readiness</h2>
            </div>
            <p className="text-xs text-muted-foreground">{readiness.explanation}</p>
          </div>
        </Section>
      </div>
    </PageTransition>
  );
}
