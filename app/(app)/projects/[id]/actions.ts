"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, StudentIntelligenceCoreService } from "@/lib/services";
import {
  createTaskSchema,
  updateTaskSchema,
  createMilestoneSchema,
  logTimeSchema,
  createDocumentSchema,
  createChangeRequestSchema,
  createQuoteSchema,
} from "@/lib/validators/project";
import { uuidSchema } from "@/lib/validators/common";
import type { Tables } from "@/types/database";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidate(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/overview");
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function createTask(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const raw = {
    project_id: formData.get("project_id"),
    title: formData.get("title"),
    description: formData.get("description") || null,
    status: formData.get("status") || "backlog",
    priority: formData.get("priority") || "medium",
    estimated_minutes: formData.get("estimated_minutes")
      ? Number(formData.get("estimated_minutes"))
      : null,
    due_date: formData.get("due_date") || null,
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    const task = await services.project.createTask(user.id, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate(parsed.data.project_id);
    return { ok: true, id: task.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create task" };
  }
}

export async function updateTask(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const taskId = uuidSchema.safeParse(formData.get("taskId"));
  const projectId = String(formData.get("projectId") ?? "");
  if (!taskId.success) return { ok: false, error: "Invalid task" };

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (["taskId", "projectId"].includes(key)) continue;
    raw[key] = value || null;
  }
  if (raw.estimated_minutes) raw.estimated_minutes = Number(raw.estimated_minutes);

  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.project.updateTask(user.id, taskId.data, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate(projectId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update task" };
  }
}

export async function deleteTask(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");
  void user;

  const taskId = uuidSchema.safeParse(formData.get("taskId"));
  const projectId = String(formData.get("projectId") ?? "");
  if (!taskId.success) return { ok: false, error: "Invalid task" };

  const services = createServices(await createClient());
  try {
    await services.project.deleteTask(taskId.data);
    revalidate(projectId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete task" };
  }
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

export async function createMilestone(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const raw = {
    project_id: formData.get("project_id"),
    title: formData.get("title"),
    description: formData.get("description") || null,
    target_date: formData.get("target_date") || null,
  };

  const parsed = createMilestoneSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.project.createMilestone(user.id, parsed.data);
    revalidate(parsed.data.project_id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create milestone" };
  }
}

export async function completeMilestone(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const milestoneId = uuidSchema.safeParse(formData.get("milestoneId"));
  const projectId = String(formData.get("projectId") ?? "");
  if (!milestoneId.success) return { ok: false, error: "Invalid milestone" };

  const services = createServices(await createClient());
  try {
    await services.project.completeMilestone(user.id, milestoneId.data);
    revalidate(projectId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to complete milestone" };
  }
}

// ---------------------------------------------------------------------------
// Time tracking
// ---------------------------------------------------------------------------

export async function logTime(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const raw = {
    project_id: formData.get("project_id"),
    task_id: formData.get("task_id") || null,
    category: formData.get("category") || "other",
    description: formData.get("description") || null,
    minutes: formData.get("minutes") ? Number(formData.get("minutes")) : 0,
  };

  const parsed = logTimeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.project.logTime(user.id, parsed.data);
    revalidate(parsed.data.project_id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to log time" };
  }
}

export async function deleteTimeEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const entryId = uuidSchema.safeParse(formData.get("entryId"));
  const projectId = String(formData.get("projectId") ?? "");
  if (!entryId.success) return { ok: false, error: "Invalid entry" };

  const services = createServices(await createClient());
  try {
    await services.project.deleteTimeEntry(entryId.data, projectId, user.id);
    revalidate(projectId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete entry" };
  }
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function createDocument(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const raw = {
    project_id: formData.get("project_id"),
    title: formData.get("title"),
    doc_type: formData.get("doc_type") || "note",
    content: formData.get("content") || null,
    file_url: formData.get("file_url") || null,
  };

  const parsed = createDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.project.createDocument(user.id, parsed.data);
    revalidate(parsed.data.project_id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create document" };
  }
}

// ---------------------------------------------------------------------------
// Change requests
// ---------------------------------------------------------------------------

export async function createChangeRequest(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const raw = {
    project_id: formData.get("project_id"),
    title: formData.get("title"),
    description: formData.get("description") || null,
    original_scope: formData.get("original_scope") || null,
    requested_change: formData.get("requested_change") || null,
    estimated_hours: formData.get("estimated_hours")
      ? Number(formData.get("estimated_hours"))
      : null,
    suggested_price: formData.get("suggested_price")
      ? Number(formData.get("suggested_price"))
      : null,
  };

  const parsed = createChangeRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.project.createChangeRequest(user.id, parsed.data);
    revalidate(parsed.data.project_id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create change request" };
  }
}

export async function approveChangeRequest(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");
  void user;

  const crId = uuidSchema.safeParse(formData.get("crId"));
  const projectId = String(formData.get("projectId") ?? "");
  if (!crId.success) return { ok: false, error: "Invalid change request" };

  const services = createServices(await createClient());
  try {
    await services.project.updateChangeRequest(crId.data, {
      status: "approved",
      approved_at: new Date().toISOString(),
    });
    revalidate(projectId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to approve" };
  }
}

export async function rejectChangeRequest(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");
  void user;

  const crId = uuidSchema.safeParse(formData.get("crId"));
  const projectId = String(formData.get("projectId") ?? "");
  if (!crId.success) return { ok: false, error: "Invalid change request" };

  const services = createServices(await createClient());
  try {
    await services.project.updateChangeRequest(crId.data, { status: "rejected" });
    revalidate(projectId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to reject" };
  }
}

export async function implementChangeRequest(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");
  void user;

  const crId = uuidSchema.safeParse(formData.get("crId"));
  const projectId = String(formData.get("projectId") ?? "");
  if (!crId.success) return { ok: false, error: "Invalid change request" };

  const services = createServices(await createClient());
  try {
    await services.project.updateChangeRequest(crId.data, { status: "implemented" });
    revalidate(projectId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to mark implemented" };
  }
}

export async function updateQuoteStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");
  void user;

  const quoteId = uuidSchema.safeParse(formData.get("quoteId"));
  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "") as Tables<"project_quotes">["status"];
  if (!quoteId.success) return { ok: false, error: "Invalid quote" };

  const services = createServices(await createClient());
  try {
    await services.project.updateQuote(quoteId.data, { status });
    revalidate(projectId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update quote" };
  }
}

// ---------------------------------------------------------------------------
// Quote engine
// ---------------------------------------------------------------------------

export async function generateQuote(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const projectId = formData.get("project_id") as string | null;
  const title = String(formData.get("title") ?? "Quotation");
  const featuresRaw = formData.get("features_json");

  let features: Array<{ title: string; description?: string; complexity?: "low" | "medium" | "high" }> = [];
  try {
    features = featuresRaw ? JSON.parse(String(featuresRaw)) : [];
  } catch {
    return { ok: false, error: "Invalid features JSON" };
  }

  const services = createServices(await createClient());
  try {
    const [preferences, project] = await Promise.all([
      services.repos.userPreferences.findByUser(user.id),
      projectId ? services.project.findById(projectId) : Promise.resolve(null),
    ]);
    const estimate = services.quoteEngine.estimate(
      features as Parameters<typeof services.quoteEngine.estimate>[0],
      { hourlyRate: preferences?.default_hourly_rate ?? null },
    );
    const quote = await services.project.createQuote(user.id, {
      project_id: projectId || null,
      client_id: project?.client_id ?? null,
      title,
      summary: estimate.summary,
      features: estimate.features,
      milestones: estimate.milestones,
      total_estimated_hours: estimate.totalHoursMax,
      price_min: estimate.priceMin,
      price_max: estimate.priceMax,
      status: "draft",
    });
    if (projectId) revalidate(projectId);
    else revalidatePath("/projects");
    return { ok: true, id: quote.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to generate quote" };
  }
}

// ---------------------------------------------------------------------------
// Void-returning wrappers for direct <form action={fn}> use (no useActionState)
// ---------------------------------------------------------------------------

export async function completeMilestoneVoid(formData: FormData): Promise<void> {
  await completeMilestone(null, formData);
}

export async function approveChangeRequestVoid(formData: FormData): Promise<void> {
  await approveChangeRequest(null, formData);
}

export async function updateTaskVoid(formData: FormData): Promise<void> {
  await updateTask(null, formData);
}

export async function deleteTaskVoid(formData: FormData): Promise<void> {
  await deleteTask(null, formData);
}

export async function deleteTimeEntryVoid(formData: FormData): Promise<void> {
  await deleteTimeEntry(null, formData);
}

export async function rejectChangeRequestVoid(formData: FormData): Promise<void> {
  await rejectChangeRequest(null, formData);
}

export async function implementChangeRequestVoid(formData: FormData): Promise<void> {
  await implementChangeRequest(null, formData);
}

export async function updateQuoteStatusVoid(formData: FormData): Promise<void> {
  await updateQuoteStatus(null, formData);
}
