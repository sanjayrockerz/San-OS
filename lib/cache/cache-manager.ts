interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hitCount: number;
}

interface CacheOptions {
  ttlMs: number;
  maxSize?: number;
  namespace?: string;
}

const DEFAULT_OPTIONS: CacheOptions = {
  ttlMs: 60_000,
  maxSize: 1000,
};

export class CacheManager<T = unknown> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly options: CacheOptions;
  private periodicCleanup: ReturnType<typeof setInterval> | null = null;

  constructor(options?: Partial<CacheOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startCleanup();
  }

  get(key: string): T | undefined {
    const entry = this.store.get(this.resolveKey(key));
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.resolveKey(key));
      return undefined;
    }

    entry.hitCount++;
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const resolvedKey = this.resolveKey(key);
    if (this.store.size >= (this.options.maxSize ?? 1000)) {
      this.evict();
    }

    this.store.set(resolvedKey, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.options.ttlMs),
      createdAt: Date.now(),
      hitCount: 0,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(this.resolveKey(key));
  }

  clear(): void {
    this.store.clear();
  }

  clearNamespace(namespace: string): void {
    const prefix = `${namespace}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  size(): number {
    return this.store.size;
  }

  stats(): { size: number; hitRate: number; memoryEstimate: string } {
    let totalHits = 0;
    let totalEntries = 0;
    for (const entry of this.store.values()) {
      totalHits += entry.hitCount;
      totalEntries++;
    }
    return {
      size: this.store.size,
      hitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
      memoryEstimate: `${(this.store.size * 256 / 1024).toFixed(1)} KB`,
    };
  }

  wrap<F extends (...args: unknown[]) => Promise<T>>(
    key: string,
    fn: F,
    ttlMs?: number,
  ): (...args: Parameters<F>) => Promise<T> {
    return async (...args: Parameters<F>) => {
      const cached = this.get(key);
      if (cached !== undefined) return cached as T;
      const result = await fn(...args);
      this.set(key, result, ttlMs);
      return result;
    };
  }

  destroy(): void {
    if (this.periodicCleanup) {
      clearInterval(this.periodicCleanup);
      this.periodicCleanup = null;
    }
    this.store.clear();
  }

  private resolveKey(key: string): string {
    return this.options.namespace ? `${this.options.namespace}:${key}` : key;
  }

  private evict(): void {
    let oldest = Date.now();
    let oldestKey: string | null = null;

    for (const [key, entry] of this.store) {
      if (entry.createdAt < oldest) {
        oldest = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) this.store.delete(oldestKey);
  }

  private startCleanup(): void {
    this.periodicCleanup = setInterval(
      () => {
        const now = Date.now();
        for (const [key, entry] of this.store) {
          if (now > entry.expiresAt) this.store.delete(key);
        }
      },
      60_000,
    );
  }
}

export const globalCache = new CacheManager({ namespace: "global", ttlMs: 30_000 });
export const dataCache = new CacheManager({ namespace: "data", ttlMs: 15_000 });
export const queryCache = new CacheManager({ namespace: "query", ttlMs: 5_000 });
