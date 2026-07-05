import type { DomainEvent, EventHandler, Subscription, SubscriptionOptions } from "./types";

export class SubscriptionRegistry {
  private subscriptions = new Map<string, Subscription>();
  private wildcardSubscriptions: Subscription[] = [];
  private sourceOrder: string[] = [];

  add<E extends DomainEvent>(
    eventType: string,
    handler: EventHandler<E>,
    options?: SubscriptionOptions,
  ): () => void {
    const id = options?.idempotencyKey ?? `${eventType}-${crypto.randomUUID()}`;
    const sub: Subscription = { id, eventType, handler: handler as EventHandler, options };
    this.subscriptions.set(id, sub);
    this.sourceOrder.push(id);
    return () => this.remove(id);
  }

  addWildcard<E extends DomainEvent>(
    handler: EventHandler<E>,
    options?: SubscriptionOptions,
  ): () => void {
    const id = `wildcard-${crypto.randomUUID()}`;
    const sub: Subscription = { id, eventType: "*", handler: handler as EventHandler, options };
    this.wildcardSubscriptions.push(sub);
    return () => {
      this.wildcardSubscriptions = this.wildcardSubscriptions.filter((s) => s.id !== id);
    };
  }

  getHandlers(eventType: string): Subscription[] {
    const direct = [...this.subscriptions.values()].filter(
      (s) => s.eventType === eventType || (s.eventType instanceof RegExp && s.eventType.test(eventType)),
    );
    return [...direct, ...this.wildcardSubscriptions];
  }

  remove(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  clear(): void {
    this.subscriptions.clear();
    this.wildcardSubscriptions = [];
    this.sourceOrder = [];
  }

  getAll(): Subscription[] {
    return [...this.subscriptions.values(), ...this.wildcardSubscriptions];
  }

  count(): number {
    return this.subscriptions.size + this.wildcardSubscriptions.length;
  }
}
