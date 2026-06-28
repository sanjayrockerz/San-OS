"use client";

import { useActionState, useState } from "react";
import { Sparkles } from "lucide-react";

import { runWhatIf, type SimulationActionResult } from "@/app/(app)/academic/planner/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type ScenarioType = "future_semester_gpa" | "course_grade" | "repeat_course" | "backlog";

const SCENARIO_LABELS: Record<ScenarioType, string> = {
  future_semester_gpa: "If I score X GPA next semester",
  course_grade: "If I improve a course's grade",
  repeat_course: "If I repeat a course",
  backlog: "If I get a backlog (fail) in a course",
};

const DIFFICULTY_VARIANT: Record<string, "success" | "default" | "warning" | "danger"> = {
  trivial: "success",
  easy: "success",
  moderate: "default",
  hard: "warning",
  severe: "danger",
};

export function WhatIfSimulator({ courses }: { courses: Pick<Tables<"iit_courses">, "id" | "name" | "grade" | "grade_point">[] }) {
  const [scenarioType, setScenarioType] = useState<ScenarioType>("future_semester_gpa");
  const [state, action, pending] = useActionState<SimulationActionResult | null, FormData>(runWhatIf, null);

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="type">Scenario</Label>
          <Select
            id="type"
            name="type"
            value={scenarioType}
            onChange={(e) => setScenarioType(e.target.value as ScenarioType)}
          >
            {Object.entries(SCENARIO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {scenarioType === "future_semester_gpa" && (
          <div className="space-y-1.5">
            <Label htmlFor="gpa">GPA</Label>
            <Input id="gpa" name="gpa" type="number" min={0} max={10} step="0.1" placeholder="9.6" required />
          </div>
        )}

        {(scenarioType === "course_grade" || scenarioType === "repeat_course") && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="courseId">Course</Label>
              <Select id="courseId" name="courseId" defaultValue={courses[0]?.id ?? ""} required>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gradePoint">New Grade Point</Label>
              <Input
                id="gradePoint"
                name="gradePoint"
                type="number"
                min={0}
                max={10}
                step="0.1"
                placeholder="9"
                required
              />
            </div>
          </div>
        )}

        {scenarioType === "backlog" && (
          <div className="space-y-1.5">
            <Label htmlFor="courseId">Course</Label>
            <Select id="courseId" name="courseId" defaultValue={courses[0]?.id ?? ""} required>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <Button type="submit" disabled={pending || courses.length === 0} size="sm">
          <Sparkles className="size-3.5 mr-1" />
          {pending ? "Simulating…" : "Run Simulation"}
        </Button>
        {courses.length === 0 && (
          <p className="text-xs text-muted-foreground">Add courses in IIT Workspace to simulate course-level scenarios.</p>
        )}
      </form>

      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}

      {state?.ok && (
        <div className={cn("rounded-xl border p-4", "border-border bg-card")}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-semibold">{state.result.label}</p>
            <Badge variant={DIFFICULTY_VARIANT[state.result.recoveryDifficulty] ?? "default"}>
              {state.result.recoveryDifficulty}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="rounded-lg border border-border p-2">
              <p className="text-base font-bold tabular">{state.result.baselineCgpa?.toFixed(2) ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">baseline CGPA</p>
            </div>
            <div className="rounded-lg border border-border p-2">
              <p className="text-base font-bold tabular">{state.result.projectedCgpa?.toFixed(2) ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground">projected CGPA</p>
            </div>
            <div className="rounded-lg border border-border p-2">
              <p
                className={cn(
                  "text-base font-bold tabular",
                  state.result.delta !== null && state.result.delta < 0 ? "text-danger" : "text-success",
                )}
              >
                {state.result.delta !== null
                  ? `${state.result.delta >= 0 ? "+" : ""}${state.result.delta.toFixed(2)}`
                  : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">delta</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{state.result.explanation}</p>
        </div>
      )}
    </div>
  );
}
