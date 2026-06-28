"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";
import { academicGoalsSchema, whatIfScenarioSchema } from "@/lib/validators/academic";
import type { WhatIfResult } from "@/lib/services/academic-simulator.service";

export type GoalsActionResult = { ok: true } | { ok: false; error: string };
export type SimulationActionResult =
  | { ok: true; result: WhatIfResult }
  | { ok: false; error: string };

export async function saveGoals(
  _prev: GoalsActionResult | null,
  formData: FormData,
): Promise<GoalsActionResult> {
  const user = await requireUser("/academic/planner");

  const raw = {
    target_cgpa: formData.get("target_cgpa") ? Number(formData.get("target_cgpa")) : null,
    dream_company: formData.get("dream_company") || null,
    total_semesters: formData.get("total_semesters") ? Number(formData.get("total_semesters")) : 8,
  };
  const parsed = academicGoalsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.repos.academicGoals.upsert(user.id, parsed.data);
    revalidatePath("/academic/planner");
    revalidatePath("/academic");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save goals" };
  }
}

export async function runWhatIf(
  _prev: SimulationActionResult | null,
  formData: FormData,
): Promise<SimulationActionResult> {
  const user = await requireUser("/academic/planner");

  const type = formData.get("type");
  let raw: Record<string, unknown>;
  switch (type) {
    case "future_semester_gpa":
      raw = { type, gpa: Number(formData.get("gpa")) };
      break;
    case "course_grade":
    case "repeat_course":
      raw = { type, courseId: formData.get("courseId"), gradePoint: Number(formData.get("gradePoint")) };
      break;
    case "backlog":
      raw = { type, courseId: formData.get("courseId") };
      break;
    default:
      return { ok: false, error: "Unknown scenario" };
  }

  const parsed = whatIfScenarioSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid scenario" };
  }

  const services = createServices(await createClient());
  try {
    const result = await services.academicSimulator.simulate(user.id, parsed.data);
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Simulation failed" };
  }
}
