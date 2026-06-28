"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, StudentIntelligenceCoreService } from "@/lib/services";
import { createClientSchema, updateClientSchema } from "@/lib/validators/business";
import { uuidSchema } from "@/lib/validators/common";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidate(clientId?: string) {
  revalidatePath("/clients");
  revalidatePath("/overview");
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function createClientRecord(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/clients/new");

  const raw = {
    name: formData.get("name"),
    company: formData.get("company") || null,
    industry: formData.get("industry") || null,
    website: formData.get("website") || null,
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    whatsapp: formData.get("whatsapp") || null,
    timezone: formData.get("timezone") || null,
    address: formData.get("address") || null,
    tax_info: formData.get("tax_info") || null,
    status: formData.get("status") || "prospect",
    notes: formData.get("notes") || null,
  };

  const parsed = createClientSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    const client = await services.client.create(user.id, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate(client.id);
    return { ok: true, id: client.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create client" };
  }
}

export async function updateClientRecord(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/clients");

  const clientId = uuidSchema.safeParse(formData.get("clientId"));
  if (!clientId.success) return { ok: false, error: "Invalid client" };

  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "clientId") continue;
    raw[key] = value || null;
  }

  const parsed = updateClientSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const services = createServices(await createClient());
  try {
    await services.client.update(user.id, clientId.data, parsed.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate(clientId.data);
    return { ok: true, id: clientId.data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update client" };
  }
}

export async function archiveClientRecord(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/clients");

  const clientId = uuidSchema.safeParse(formData.get("clientId"));
  if (!clientId.success) return { ok: false, error: "Invalid client" };

  const services = createServices(await createClient());
  try {
    await services.client.archive(user.id, clientId.data);
    StudentIntelligenceCoreService.invalidate(user.id);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to archive client" };
  }
}
