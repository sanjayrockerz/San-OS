"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

export type ResourceUploadResult = { ok: true; message: string } | { ok: false; error: string };

export async function uploadResource(_prev: ResourceUploadResult | null, formData: FormData): Promise<ResourceUploadResult> {
  const user = await requireUser("/resources");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image or PDF first" };
  const allowed = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"]);
  if (!allowed.has(file.type)) return { ok: false, error: "Only PDF, PNG, JPEG, WEBP, and GIF files are supported" };
  if (file.size > 25 * 1024 * 1024) return { ok: false, error: "Files must be smaller than 25 MB" };
  const title = String(formData.get("title") ?? file.name).trim() || file.name;
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const db = await createClient();
  const { error: uploadError } = await db.storage.from("attachments").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: `Upload failed: ${uploadError.message}` };
  try {
    const services = createServices(db);
    await services.resource.createResource(user.id, { title, description: String(formData.get("description") ?? "").trim() || undefined, resource_type: file.type === "application/pdf" ? "pdf" : "image", mime_type: file.type, size_bytes: file.size, storage_path: path, metadata: { originalName: file.name, bucket: "attachments" } });
    revalidatePath("/resources");
    return { ok: true, message: `${title} saved to Resource Center` };
  } catch (error) {
    await db.storage.from("attachments").remove([path]);
    return { ok: false, error: error instanceof Error ? error.message : "Could not save file metadata" };
  }
}
