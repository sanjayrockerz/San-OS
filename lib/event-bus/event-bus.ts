import type { Repositories } from "@/lib/repositories";
import { captureException, captureEvent } from "@/lib/observability/logger";
import type { Json } from "@/types/database";
import { SubscriptionRegistry } from "./subscription-registry";
import type {
  DomainEvent,
  EventBusStats,
  EventHandler,
  EventMetadata,
  SubscriptionOptions,
} from "./types";
import { SYSTEM_EVENT_TYPES } from "./types";

export interface ReplayOptions {
  from?: string;
  to?: string;
  limit?: number;
  eventTypes?: string[];
}

export class EventBus {
  private readonly registry = new SubscriptionRegistry();
  private stats: EventBusStats = {
    totalEmitted: 0,
    totalHandled: 0,
    totalFailed: 0,
    activeSubscriptions: 0,
    replayInProgress: false,
  };

  constructor(private readonly repos: Repositories) {}

  async emit<T extends string, P extends Record<string, unknown>>(
    userId: string,
    type: T,
    payload?: P,
    metadata?: Partial<EventMetadata>,
  ): Promise<DomainEvent<T, P>> {
    const event: DomainEvent<T, P> = {
      id: crypto.randomUUID(),
      type,
      userId,
      entityType: metadata?.source ?? null,
      entityId: null,
      payload: (payload ?? {}) as P,
      timestamp: new Date().toISOString(),
      metadata: {
        correlationId: metadata?.correlationId ?? crypto.randomUUID(),
        causationId: metadata?.causationId,
        source: metadata?.source ?? "event-bus",
        version: metadata?.version ?? 1,
      },
    };

    this.stats.totalEmitted++;

    try {
      await this.repos.events.create({
        user_id: userId,
        event_type: type,
        entity_type: event.entityType,
        entity_id: event.entityId,
        payload: (event.payload ?? {}) as unknown as Json,
      });
    } catch (error) {
      captureException(error, { context: "EventBus.persist", eventType: type });
    }

    await this.dispatch(event);

    return event;
  }

  async emitDomainEvent<E extends DomainEvent>(event: E): Promise<void> {
    this.stats.totalEmitted++;

    try {
      await this.repos.events.create({
        user_id: event.userId,
        event_type: event.type,
        entity_type: event.entityType,
        entity_id: event.entityId,
        payload: (event.payload ?? {}) as unknown as Json,
      });
    } catch (error) {
      captureException(error, { context: "EventBus.persistDomainEvent", eventType: event.type });
    }

    await this.dispatch(event);
  }

  on<E extends DomainEvent>(
    eventType: string,
    handler: EventHandler<E>,
    options?: SubscriptionOptions,
  ): () => void {
    const unsub = this.registry.add(eventType, handler, options);
    this.stats.activeSubscriptions = this.registry.count();
    return unsub;
  }

  onAny<E extends DomainEvent>(
    handler: EventHandler<E>,
    options?: SubscriptionOptions,
  ): () => void {
    const unsub = this.registry.addWildcard(handler, options);
    this.stats.activeSubscriptions = this.registry.count();
    return unsub;
  }

  off(id: string): boolean {
    const result = this.registry.remove(id);
    this.stats.activeSubscriptions = this.registry.count();
    return result;
  }

  async replay(userId: string, options?: ReplayOptions): Promise<number> {
    this.stats.replayInProgress = true;

    await this.emit(userId, SYSTEM_EVENT_TYPES.ReplayStarted, {
      options: options ?? {},
    });

    const events = await this.repos.events.recent(userId, options?.limit ?? 200);
    let count = 0;

    for (const record of events) {
      if (options?.eventTypes && !options.eventTypes.includes(record.event_type)) continue;
      if (options?.from && record.created_at < options.from) continue;
      if (options?.to && record.created_at > options.to) continue;

      const event: DomainEvent = {
        id: record.id,
        type: record.event_type,
        userId: record.user_id,
        entityType: record.entity_type,
        entityId: record.entity_id,
        payload: (record.payload ?? {}) as Record<string, unknown>,
        timestamp: record.created_at,
        metadata: { source: "replay", correlationId: crypto.randomUUID(), version: 1 },
      };

      await this.dispatch(event, true);
      count++;
    }

    await this.emit(userId, SYSTEM_EVENT_TYPES.ReplayCompleted, {
      count,
      options: options ?? {},
    });

    this.stats.replayInProgress = false;
    return count;
  }

  stats(): EventBusStats {
    return { ...this.stats };
  }

  registrySize(): number {
    return this.registry.count();
  }

  clear(): void {
    this.registry.clear();
    this.stats = {
      totalEmitted: 0,
      totalHandled: 0,
      totalFailed: 0,
      activeSubscriptions: 0,
      replayInProgress: false,
    };
  }

  private async dispatch(event: DomainEvent, isReplay = false): Promise<void> {
    const handlers = this.registry.getHandlers(event.type);

    const results = await Promise.allSettled(
      handlers.map(async (sub) => {
        if (sub.options?.filter && !sub.options.filter(event)) return;
        try {
          await sub.handler(event);
          this.stats.totalHandled++;
        } catch (error) {
          this.stats.totalFailed++;
          captureException(error, {
            context: "EventBus.dispatch",
            eventType: event.type,
            subscriptionId: sub.id,
            isReplay,
          });
        }
      }),
    );

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0 && !isReplay) {
      captureEvent("event_bus.dispatch_failures", {
        eventType: event.type,
        failureCount: failures.length,
      });
    }
  }
}
