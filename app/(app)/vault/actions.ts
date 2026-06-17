"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createServices,
  DashboardAggregationService,
  KNOWLEDGE_TYPES,
  type KnowledgeType,
  type LinkEntityType,
} from "@/lib/services";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const LINK_TYPES = new Set<LinkEntityType>([
  "problem",
  "topic",
  "pattern",
  "concept",
  "iit_course",
]);

function parseType(value: FormDataEntryValue | null): KnowledgeType | null {
  return typeof value === "string" &&
    (KNOWLEDGE_TYPES as readonly string[]).includes(value)
    ? (value as KnowledgeType)
    : null;
}

function parseTags(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

/**
 * Creates a Knowledge Vault item. Wraps KnowledgeService.create (which emits
 * `knowledge.created`, logs activity, and links any supplied entity), then
 * revalidates the vault and overview so the timeline / recent-knowledge rail
 * pick it up.
 */
export async function createKnowledgeItem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/vault");

  const type = parseType(formData.get("type"));
  const title = formData.get("title");
  if (!type || typeof title !== "string" || !title.trim()) {
    return { ok: false, error: "A title and type are required" };
  }

  const content = formData.get("content");
  const url = formData.get("url");
  const linkEntityType = formData.get("linkEntityType");
  const linkEntityId = formData.get("linkEntityId");

  const links =
    typeof linkEntityType === "string" &&
    LINK_TYPES.has(linkEntityType as LinkEntityType) &&
    typeof linkEntityId === "string" &&
    linkEntityId.trim()
      ? [
          {
            entityType: linkEntityType as LinkEntityType,
            entityId: linkEntityId.trim(),
          },
        ]
      : undefined;

  const services = createServices(await createClient());
  try {
    const item = await services.knowledge.create(user.id, {
      type,
      title: title.trim(),
      content: typeof content === "string" && content.trim() ? content : null,
      url: typeof url === "string" && url.trim() ? url : null,
      tags: parseTags(formData.get("tags")),
      links,
    });
    DashboardAggregationService.invalidate(user.id);
    
    try {
      await services.context.touch(user.id, {
        active_entity_type: "vault",
        active_entity_id: item.id,
        active_session_type: "learn",
      });
    } catch {
      // best effort
    }

    revalidatePath("/vault");
    revalidatePath("/overview");
    return { ok: true, id: item.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save item",
    };
  }
}

/** Updates title, content, url, and tags on an existing vault item. */
export async function updateKnowledgeItem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/vault");
  const id = formData.get("id");
  if (typeof id !== "string") return { ok: false, error: "Invalid item" };

  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) {
    return { ok: false, error: "Title is required" };
  }

  const services = createServices(await createClient());
  try {
    await services.knowledge.update(user.id, id, {
      title: title.trim(),
      content: (formData.get("content") as string) || null,
      url: (formData.get("url") as string) || null,
      tags: parseTags(formData.get("tags")),
    });
    DashboardAggregationService.invalidate(user.id);
    revalidatePath("/vault");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update item",
    };
  }
}

/** Deletes a vault item. Wraps KnowledgeService.remove (emits `knowledge.deleted`). */
export async function deleteKnowledgeItem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/vault");
  const id = formData.get("id");
  if (typeof id !== "string") return { ok: false, error: "Invalid item" };

  const services = createServices(await createClient());
  try {
    await services.knowledge.remove(user.id, id);
    DashboardAggregationService.invalidate(user.id);
    revalidatePath("/vault");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to delete item",
    };
  }
}
