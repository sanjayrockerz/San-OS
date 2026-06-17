"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, DashboardAggregationService } from "@/lib/services";
import {
  createCourseSchema,
  createAssignmentSchema,
  createLectureSchema,
} from "@/lib/validators/iit";
import { uuidSchema } from "@/lib/validators/common";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function revalidate(courseId?: string) {
  revalidatePath("/iit-workspace");
  revalidatePath("/overview");
  if (courseId) revalidatePath(`/iit-workspace/${courseId}`);
}

export async function createCourse(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/iit-workspace");

  const raw = {
    name: formData.get("name"),
    code: formData.get("code") || null,
    credits: formData.get("credits") ? Number(formData.get("credits")) : null,
    semester: formData.get("semester") || null,
    status: formData.get("status") || "in_progress",
    instructor: formData.get("instructor") || null,
  };
  const parsed = createCourseSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    const course = await services.iit.createCourse(user.id, parsed.data);
    DashboardAggregationService.invalidate(user.id);
    revalidate(course.id);
    return { ok: true, id: course.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create course" };
  }
}

export async function createAssignment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/iit-workspace");

  const raw = {
    title: formData.get("title"),
    course_id: formData.get("course_id") || null,
    due_date: formData.get("due_date") || null,
    description: formData.get("description") || null,
    max_score: formData.get("max_score") ? Number(formData.get("max_score")) : null,
    status: "pending",
  };
  const parsed = createAssignmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    const assignment = await services.iit.createAssignment(user.id, parsed.data);
    DashboardAggregationService.invalidate(user.id);
    revalidate(parsed.data.course_id ?? undefined);
    return { ok: true, id: assignment.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create assignment" };
  }
}

export async function createLecture(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/iit-workspace");

  const raw = {
    title: formData.get("title"),
    course_id: formData.get("course_id") || null,
    lecture_number: formData.get("lecture_number") ? Number(formData.get("lecture_number")) : null,
    duration_minutes: formData.get("duration_minutes") ? Number(formData.get("duration_minutes")) : null,
    video_url: formData.get("video_url") || null,
    notes: formData.get("notes") || null,
    status: "not_started",
  };
  const parsed = createLectureSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    const lecture = await services.iit.createLecture(user.id, parsed.data);
    revalidate(parsed.data.course_id ?? undefined);
    return { ok: true, id: lecture.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create lecture" };
  }
}

export async function completeAssignment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/iit-workspace");

  const assignmentId = uuidSchema.safeParse(formData.get("assignmentId"));
  const courseId = formData.get("courseId");
  if (!assignmentId.success) return { ok: false, error: "Invalid assignment" };

  const score = formData.get("score") ? Number(formData.get("score")) : undefined;

  const services = createServices(await createClient());
  try {
    await services.iit.completeAssignment(user.id, assignmentId.data, score);
    DashboardAggregationService.invalidate(user.id);
    
    try {
      await services.context.touch(user.id, {
        active_entity_type: "iit_assignment",
        active_entity_id: assignmentId.data,
        active_session_type: "iit_academic",
      });
    } catch {
      // best effort
    }

    revalidate(typeof courseId === "string" ? courseId : undefined);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to complete assignment" };
  }
}

export async function watchLecture(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/iit-workspace");

  const lectureId = uuidSchema.safeParse(formData.get("lectureId"));
  const courseId = formData.get("courseId");
  if (!lectureId.success) return { ok: false, error: "Invalid lecture" };

  const services = createServices(await createClient());
  try {
    await services.iit.watchLecture(user.id, lectureId.data);
    DashboardAggregationService.invalidate(user.id);

    try {
      await services.context.touch(user.id, {
        active_entity_type: "iit_lecture",
        active_entity_id: lectureId.data,
        active_session_type: "iit_academic",
      });
    } catch {
      // best effort
    }

    revalidate(typeof courseId === "string" ? courseId : undefined);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to mark lecture watched" };
  }
}
