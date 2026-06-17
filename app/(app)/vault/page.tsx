import { requireContext } from "@/lib/server/context";
import {
  VaultClient,
  type VaultItemView,
} from "@/components/vault/vault-client";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/**
 * Knowledge Vault — stores and retrieves everything related to learning. Reads
 * come straight from KnowledgeService (the single vault read path); all writes
 * go through Server Actions → KnowledgeService, never from the client directly.
 */
export default async function VaultPage() {
  const { user, services } = await requireContext("/vault");

  const items = await safe(services.knowledge.list(user.id), []);

  const view: VaultItemView[] = items.map((i) => ({
    id: i.id,
    type: i.type,
    title: i.title,
    content: i.content,
    url: i.url,
    tags: i.tags,
    updatedAt: i.updated_at,
  }));

  return <VaultClient items={view} />;
}
