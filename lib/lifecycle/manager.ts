import type { DbClient } from "@/lib/repositories";

export type LifecycleOperation = "create" | "update" | "archive" | "restore" | "delete" | "merge" | "undo";

export interface LifecycleChange {
  userId: string;
  entityType: string;
  entityId: string;
  operation: LifecycleOperation;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Small adapter around the append-only lifecycle seam. It is intentionally
 * fail-soft: history must never make a successful domain mutation fail.
 */
export async function recordLifecycleChange(client: DbClient, change: LifecycleChange): Promise<void> {
  const db = client as unknown as { from: (table: string) => { insert: (row: Record<string, unknown>) => Promise<{ error: unknown }> } };
  try {
    await db.from("entity_history").insert({
      user_id: change.userId,
      entity_type: change.entityType,
      entity_id: change.entityId,
      operation: change.operation,
      before_state: change.beforeState ?? null,
      after_state: change.afterState ?? null,
      metadata: change.metadata ?? {},
    });
  } catch {
    // Audit/history is secondary to the user-facing mutation.
  }
}
