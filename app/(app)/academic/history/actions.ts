"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";
import { academicSemesterSchema } from "@/lib/validators/academic";
import { uuidSchema } from "@/lib/validators/common";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidate() {
  revalidatePath("/academic/history");
  revalidatePath("/academic");
  revalidatePath("/academic/planner");
}

function parseSemesterForm(formData: FormData) {
  return {
    semester_number: Number(formData.get("semester_number")),
    name: formData.get("name"),
    academic_year: formData.get("academic_year") || null,
    total_credits: formData.get("total_credits") ? Number(formData.get("total_credits")) : null,
    earned_credits: formData.get("earned_credits") ? Number(formData.get("earned_credits")) : null,
    sgpa: formData.get("sgpa") ? Number(formData.get("sgpa")) : null,
    cgpa_after: formData.get("cgpa_after") ? Number(formData.get("cgpa_after")) : null,
    backlogs: formData.get("backlogs") ? Number(formData.get("backlogs")) : 0,
    status: formData.get("status") || "upcoming",
    is_current: formData.get("is_current") === "on",
  };
}

export async function createSemester(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/academic/history");

  const parsed = academicSemesterSchema.safeParse(parseSemesterForm(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    if (parsed.data.is_current) {
      const existingCurrent = await services.repos.academicSemesters.findCurrent(user.id);
      if (existingCurrent) {
        await services.repos.academicSemesters.update(existingCurrent.id, { is_current: false });
      }
    }
    const semester = await services.repos.academicSemesters.create({
      ...parsed.data,
      user_id: user.id,
    });
    revalidate();
    return { ok: true, id: semester.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create semester" };
  }
}

export async function updateSemester(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/academic/history");

  const idResult = uuidSchema.safeParse(formData.get("id"));
  if (!idResult.success) return { ok: false, error: "Invalid semester" };

  const parsed = academicSemesterSchema.safeParse(parseSemesterForm(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    if (parsed.data.is_current) {
      const existingCurrent = await services.repos.academicSemesters.findCurrent(user.id);
      if (existingCurrent && existingCurrent.id !== idResult.data) {
        await services.repos.academicSemesters.update(existingCurrent.id, { is_current: false });
      }
    }
    await services.repos.academicSemesters.update(idResult.data, parsed.data);
    revalidate();
    return { ok: true, id: idResult.data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update semester" };
  }
}

export async function deleteSemester(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser("/academic/history");

  const idResult = uuidSchema.safeParse(formData.get("id"));
  if (!idResult.success) return { ok: false, error: "Invalid semester" };

  const services = createServices(await createClient());
  try {
    await services.repos.academicSemesters.delete(idResult.data);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete semester" };
  }
}
