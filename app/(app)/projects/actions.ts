"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, StudentIntelligenceCoreService } from "@/lib/services";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validators/project";
import { uuidSchema } from "@/lib/validators/common";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidate(projectId?: string) {
  revalidatePath("/projects");
  revalidatePath("/overview");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function createProject(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects/new");

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || null,
    type: formData.get("type") || "internal",
    status: formData.get("status") || "planning",
    priority: formData.get("priority") || "medium",
    tags: formData.getAll("tags").filter(Boolean) as string[],
    client_id: formData.get("client_id") || null,
    client_name: formData.get("client_name") || null,
    client_email: formData.get("client_email") || null,
    repository_url: formData.get("repository_url") || null,
    deployment_url: formData.get("deployment_url") || null,
    production_url: formData.get("production_url") || null,
    estimated_hours: formData.get("estimated_hours")
      ? Number(formData.get("estimated_hours"))
      : null,
    budget: formData.get("budget") ? Number(formData.get("budget")) : null,
    start_date: formData.get("start_date") || null,
    deadline: formData.get("deadline") || null,
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    const project = await services.project.create(user.id, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate(project.id);
    return { ok: true, id: project.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create project" };
  }
}

export async function updateProject(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const projectId = uuidSchema.safeParse(formData.get("projectId"));
  if (!projectId.success) return { ok: false, error: "Invalid project" };

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "projectId") continue;
    if (key === "tags") continue;
    raw[key] = value || null;
  }
  const tags = formData.getAll("tags").filter(Boolean) as string[];
  if (tags.length > 0) raw.tags = tags;
  if (formData.get("estimated_hours"))
    raw.estimated_hours = Number(formData.get("estimated_hours"));
  if (formData.get("budget")) raw.budget = Number(formData.get("budget"));

  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.project.update(user.id, projectId.data, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate(projectId.data);
    return { ok: true, id: projectId.data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update project" };
  }
}

export async function deleteProject(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/projects");

  const projectId = uuidSchema.safeParse(formData.get("projectId"));
  if (!projectId.success) return { ok: false, error: "Invalid project" };

  const services = createServices(await createClient());
  try {
    await services.project.delete(user.id, projectId.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete project" };
  }
}
