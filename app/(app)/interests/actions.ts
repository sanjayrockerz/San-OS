"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { recordLifecycleChange } from "@/lib/lifecycle/manager";
import type { Interest } from "@/lib/interests/types";

type Result = { ok: true; id?: string } | { ok: false; error: string };
type InterestDb = { from: (table: string) => any };

function db(client: Awaited<ReturnType<typeof createClient>>): InterestDb {
  return client as unknown as InterestDb;
}

function refresh() { revalidatePath("/interests"); revalidatePath("/overview"); }

export async function createInterest(_prev: Result | null, formData: FormData): Promise<Result> {
  const user = await requireUser("/interests");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name your interest first" };
  const client = await createClient();
  const { data, error } = await db(client).from("interests").insert({ user_id: user.id, name, description: String(formData.get("description") ?? "").trim() || null }).select("*").single();
  if (error) return { ok: false, error: error.message ?? "Could not create interest" };
  await recordLifecycleChange(client, { userId: user.id, entityType: "interest", entityId: data.id, operation: "create", afterState: data });
  refresh();
  return { ok: true, id: data.id };
}

export async function updateInterest(_prev: Result | null, formData: FormData): Promise<Result> {
  const user = await requireUser("/interests");
  const id = String(formData.get("id") ?? "");
  const progress = Math.max(0, Math.min(100, Number(formData.get("progress") ?? 0)));
  if (!id || !Number.isFinite(progress)) return { ok: false, error: "Invalid interest" };
  const client = await createClient();
  const before = await db(client).from("interests").select("*").eq("id", id).eq("user_id", user.id).single();
  const { data, error } = await db(client).from("interests").update({ progress, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).select("*").single();
  if (error) return { ok: false, error: error.message ?? "Could not update interest" };
  await recordLifecycleChange(client, { userId: user.id, entityType: "interest", entityId: id, operation: "update", beforeState: before.data, afterState: data });
  refresh();
  return { ok: true, id };
}

export async function archiveInterest(_prev: Result | null, formData: FormData): Promise<Result> {
  const user = await requireUser("/interests");
  const id = String(formData.get("id") ?? "");
  const client = await createClient();
  const before = await db(client).from("interests").select("*").eq("id", id).eq("user_id", user.id).single();
  const { data, error } = await db(client).from("interests").update({ status: "archived", updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).select("*").single();
  if (error) return { ok: false, error: error.message ?? "Could not archive interest" };
  await recordLifecycleChange(client, { userId: user.id, entityType: "interest", entityId: id, operation: "archive", beforeState: before.data, afterState: data });
  refresh();
  return { ok: true, id };
}
