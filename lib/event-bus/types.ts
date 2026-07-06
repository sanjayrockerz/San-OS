export type EventHandler<E extends DomainEvent = DomainEvent> = (event: E) => void | Promise<void>;

export interface DomainEvent<T = string, P = Record<string, unknown>> {
  readonly id: string;
  readonly type: T;
  readonly userId: string;
  readonly entityType?: string | null;
  readonly entityId?: string | null;
  readonly payload: P;
  readonly timestamp: string;
  readonly metadata?: EventMetadata;
}

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  source: string;
  version: number;
}

export interface Subscription<E extends DomainEvent = DomainEvent> {
  id: string;
  eventType: string | RegExp;
  handler: EventHandler<E>;
  options?: SubscriptionOptions;
}

export interface SubscriptionOptions {
  idempotencyKey?: string;
  maxRetries?: number;
  filter?: (event: DomainEvent) => boolean;
  async?: boolean;
}

export interface EventBusStats {
  totalEmitted: number;
  totalHandled: number;
  totalFailed: number;
  activeSubscriptions: number;
  replayInProgress: boolean;
}

export const SYSTEM_EVENT_TYPES = {
  BusInitialized: "system.bus.initialized",
  SubscriptionAdded: "system.subscription.added",
  SubscriptionRemoved: "system.subscription.removed",
  HandlerFailed: "system.handler.failed",
  ReplayStarted: "system.replay.started",
  ReplayCompleted: "system.replay.completed",
} as const;
