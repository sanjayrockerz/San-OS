import type { SearchProvider, SearchResult, SearchOptions, ProviderHealth } from "./types";

export class NoopSearchProvider implements SearchProvider {
  readonly id = "noop-search";
  readonly name = "No-op Search Provider";

  isAvailable(): boolean {
    return false;
  }

  async health(): Promise<ProviderHealth> {
    return { status: "unavailable", lastChecked: new Date().toISOString() };
  }

  async search(): Promise<SearchResult[]> {
    return [];
  }

  async index(): Promise<void> {}
}

interface IndexEntry {
  entityType: string;
  entityId: string;
  content: string;
  indexedAt: string;
}

export class InMemorySearchProvider implements SearchProvider {
  readonly id = "in-memory";
  readonly name = "In-Memory Search Provider";
  private readonly entries = new Map<string, IndexEntry>();

  isAvailable(): boolean {
    return true;
  }

  async health(): Promise<ProviderHealth> {
    return { status: "healthy", lastChecked: new Date().toISOString() };
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const lower = query.toLowerCase();
    const limit = options?.limit ?? 10;

    const results: SearchResult[] = [];

    for (const [, entry] of this.entries) {
      if (options?.entityTypes && !options.entityTypes.includes(entry.entityType)) continue;

      const titleMatch = entry.content.toLowerCase().includes(lower);
      const score = titleMatch ? 1 : this.fuzzyScore(lower, entry.content.toLowerCase());

      if (score > 0.3) {
        const snippet = this.extractSnippet(entry.content, lower);
        results.push({
          id: `${entry.entityType}-${entry.entityId}`,
          title: entry.content.split("\n")[0]?.slice(0, 100) ?? "Result",
          snippet,
          entityType: entry.entityType,
          entityId: entry.entityId,
          score: Math.round(score * 100),
          href: `/${entry.entityType.replace(/_/g, "-")}/${entry.entityId}`,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async index(entityType: string, entityId: string, content: string): Promise<void> {
    this.entries.set(`${entityType}:${entityId}`, {
      entityType,
      entityId,
      content,
      indexedAt: new Date().toISOString(),
    });
  }

  private fuzzyScore(query: string, text: string): number {
    let score = 0;
    let textIdx = 0;
    for (const char of query) {
      const pos = text.indexOf(char, textIdx);
      if (pos === -1) return 0;
      score += 1 / (pos - textIdx + 1);
      textIdx = pos + 1;
    }
    return score / query.length;
  }

  private extractSnippet(text: string, query: string, contextChars = 80): string {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text.slice(0, 150);
    const start = Math.max(0, idx - contextChars);
    const end = Math.min(text.length, idx + query.length + contextChars);
    return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
  }
}
