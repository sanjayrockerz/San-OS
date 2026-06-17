import { requireContext } from "@/lib/server/context";
import { RevisionClient } from "@/components/revision/revision-client";
import type { RevisionWorkspace } from "@/lib/services";

const EMPTY: RevisionWorkspace = {
  hero: { dueToday: 0, weakestTopic: null, estimatedMinutes: 0, streak: 0 },
  cards: [],
};

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/**
 * Revision Workspace — the daily spaced-repetition session. The whole read model
 * (hero summary + detailed due cards) is assembled by RevisionService.workspace;
 * the page maps it onto the client and holds no analytics logic.
 */
export default async function RevisionPage() {
  const { user, services } = await requireContext("/revision");
  const workspace = await safe(services.revision.workspace(user.id), EMPTY);
  return <RevisionClient workspace={workspace} />;
}
