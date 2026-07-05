import type { Repositories } from "@/lib/repositories";
import { EventBus } from "@/lib/event-bus";
import type { Tables } from "@/types/database";

export interface GlobalContext {
  userId: string;
  currentProject: { id: string; title: string } | null;
  currentClient: { id: string; name: string } | null;
  currentGoal: { id: string; title: string } | null;
  currentMeeting: { id: string; title: string } | null;
  currentCourse: { id: string; title: string } | null;
  currentFocusSession: { id: string; title: string } | null;
  currentPlannerBlock: { id: string; title: string } | null;
  currentWorkspace: { id: string; type: string } | null;
  lastActiveAt: string;
  activeEntityType: string | null;
  activeEntityId: string | null;
  pendingAction: string | null;
}

export class ContextManager {
  private static instances = new Map<string, GlobalContext>();

  constructor(
    private readonly repos: Repositories,
    private readonly eventBus: EventBus,
  ) {}

  async get(userId: string): Promise<GlobalContext> {
    const cached = ContextManager.instances.get(userId);
    if (cached) return cached;

    const context = await this.load(userId);
    ContextManager.instances.set(userId, context);
    return context;
  }

  async refresh(userId: string): Promise<GlobalContext> {
    const context = await this.load(userId);
    ContextManager.instances.set(userId, context);
    return context;
  }

  async update(
    userId: string,
    patch: Partial<GlobalContext>,
  ): Promise<GlobalContext> {
    const current = await this.get(userId);
    const updated = { ...current, ...patch, lastActiveAt: new Date().toISOString() };
    ContextManager.instances.set(userId, updated);

    try {
      await this.repos.userContext.upsert(userId, {
        active_entity_type: updated.activeEntityType ?? null,
        active_entity_id: updated.activeEntityId ?? null,
        active_session_type: updated.currentFocusSession?.id ?? null,
        current_focus_topic: updated.currentGoal?.title ?? null,
        pending_action: updated.pendingAction ?? null,
        resume_payload: {},
      });
    } catch {
      // fail-soft
    }

    await this.eventBus.emit(userId, "context.updated", {
      patch: Object.keys(patch),
      timestamp: updated.lastActiveAt,
    });

    return updated;
  }

  async setActiveEntity(
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<void> {
    await this.update(userId, { activeEntityType: entityType, activeEntityId: entityId });
  }

  clearCache(userId: string): void {
    ContextManager.instances.delete(userId);
  }

  static invalidate(userId: string): void {
    ContextManager.instances.delete(userId);
  }

  private async load(userId: string): Promise<GlobalContext> {
    const ctx = await this.repos.userContext.findByUser(userId).catch(() => null);

    const [projects, goals] = await Promise.all([
      this.repos.projects.findByUser(userId).catch(() => []),
      this.repos.userGoals.findByUser(userId).catch(() => []),
    ]);

    const activeProject = projects.find((p) => p.status === "active") ?? null;
    const activeGoal = goals.find((g) => !g.is_completed) ?? null;

    return {
      userId,
      currentProject: activeProject ? { id: activeProject.id, title: activeProject.title } : null,
      currentClient: null,
      currentGoal: activeGoal ? { id: activeGoal.id, title: activeGoal.title } : null,
      currentMeeting: null,
      currentCourse: null,
      currentFocusSession: null,
      currentPlannerBlock: null,
      currentWorkspace: null,
      lastActiveAt: ctx?.updated_at ?? new Date().toISOString(),
      activeEntityType: ctx?.active_entity_type ?? null,
      activeEntityId: ctx?.active_entity_id ?? null,
      pendingAction: ctx?.pending_action ?? null,
    };
  }
}
