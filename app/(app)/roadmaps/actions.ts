"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices, DashboardAggregationService } from "@/lib/services";
import { uuidSchema } from "@/lib/validators/common";
import { Constants } from "@/types/database";

export type ActionResult = { ok: true } | { ok: false; error: string };

type ItemStatus = (typeof Constants.public.Enums.roadmap_item_status)[number];

const VALID_STATUSES = new Set<string>(Constants.public.Enums.roadmap_item_status);

export async function markRoadmapItem(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser("/roadmaps");

  const roadmapId = uuidSchema.safeParse(formData.get("roadmapId"));
  const itemId = uuidSchema.safeParse(formData.get("itemId"));
  const statusRaw = formData.get("status");

  if (!roadmapId.success || !itemId.success) {
    return { ok: false, error: "Invalid roadmap or item ID" };
  }
  if (typeof statusRaw !== "string" || !VALID_STATUSES.has(statusRaw)) {
    return { ok: false, error: "Invalid status" };
  }

  const services = createServices(await createClient());
  try {
    await services.roadmaps.markItem(
      user.id,
      roadmapId.data,
      itemId.data,
      statusRaw as ItemStatus,
    );
    DashboardAggregationService.invalidate(user.id);
    revalidatePath(`/roadmaps/${roadmapId.data}`);
    revalidatePath("/roadmaps");
    revalidatePath("/overview");
    revalidatePath("/analytics");
    revalidatePath("/revision");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update progress",
    };
  }
}
