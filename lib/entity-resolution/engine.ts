import type { Repositories } from "@/lib/repositories";
import type {
  EntityCandidate,
  EntityResolutionResult,
  EntityType,
  ResolvedEntity,
  ResolutionContext,
} from "./types";
import { fuzzyMatch } from "./fuzzy";

const AUTO_LINK_THRESHOLD = 0.85;
const AMBIGUOUS_THRESHOLD = 0.6;

export class EntityResolutionEngine {
  constructor(private readonly repos: Repositories) {}

  async resolve(ctx: ResolutionContext): Promise<EntityResolutionResult> {
    const candidates = await this.gatherCandidates(ctx);
    const scored = candidates.map((c) => ({
      ...c,
      score: this.scoreCandidate(c, ctx),
    }));
    const filtered = scored.filter((c) => c.score >= AMBIGUOUS_THRESHOLD);
    filtered.sort((a, b) => b.score - a.score);

    const threshold = this.resolveThreshold(ctx);
    const aboveThreshold = filtered.filter((c) => c.score >= threshold);
    const bestRaw = aboveThreshold.length > 0 ? aboveThreshold[0] : null;

    const toResolved = (c: typeof filtered[number]): ResolvedEntity => ({
      type: c.type as EntityType,
      id: c.id,
      name: c.name,
      confidence: Math.round(c.score * 100) / 100,
      context: c.context,
      href: c.href,
    });

    const matches = filtered.map(toResolved);
    const best = bestRaw ? toResolved(bestRaw) : null;
    const needsClarification = !bestRaw && filtered.length > 0;
    const ambiguousOptions = needsClarification ? filtered.map(toResolved) : undefined;

    return {
      matches,
      best,
      needsClarification,
      clarificationMessage: needsClarification
        ? this.buildClarification(filtered)
        : undefined,
      ambiguousOptions,
    };
  }

  async resolveStrict(ctx: ResolutionContext): Promise<ResolvedEntity | null> {
    const result = await this.resolve(ctx);
    return result.best;
  }

  async resolveChain(ctx: ResolutionContext): Promise<{ primary: ResolvedEntity | null, related: ResolvedEntity[] }> {
    const result = await this.resolve(ctx);
    if (!result.best) return { primary: null, related: [] };

    const primary = result.best;
    const related: ResolvedEntity[] = [];

    // Simple context chain heuristic based on the primary match
    if (primary.type === "project") {
      // Find a client for this project if possible from matches
      const clientMatch = result.matches.find(m => m.type === "client");
      if (clientMatch) related.push(clientMatch);
    } else if (primary.type === "client") {
      const projectMatch = result.matches.find(m => m.type === "project");
      if (projectMatch) related.push(projectMatch);
    } else if (primary.type === "task" || primary.type === "meeting") {
      const projectMatch = result.matches.find(m => m.type === "project");
      const clientMatch = result.matches.find(m => m.type === "client");
      if (projectMatch) related.push(projectMatch);
      if (clientMatch) related.push(clientMatch);
    }

    return { primary, related };
  }

  async resolveMany(inputs: { text: string; type?: EntityType }[], ctx: ResolutionContext): Promise<Map<string, ResolvedEntity | null>> {
    const results = new Map<string, ResolvedEntity | null>();
    for (const input of inputs) {
      const result = await this.resolve({ ...ctx, text: input.text });
      results.set(input.text, result.best);
    }
    return results;
  }

  private scoreCandidate(candidate: EntityCandidate, ctx: ResolutionContext): number {
    const nameScore = fuzzyMatch(ctx.text, candidate.name);
    let aliasScore = 0;
    for (const alias of candidate.aliases) {
      aliasScore = Math.max(aliasScore, fuzzyMatch(ctx.text, alias));
    }
    let contextBoost = 0;
    if (candidate.type === "project" && ctx.currentProjectId === candidate.id) contextBoost = 0.1;
    if (candidate.type === "client" && ctx.currentClientId === candidate.id) contextBoost = 0.1;
    if (ctx.recentEntityIds?.includes(candidate.id)) contextBoost = 0.05;
    const base = Math.max(nameScore, aliasScore);
    return Math.min(1, base + contextBoost);
  }

  private resolveThreshold(ctx: ResolutionContext): number {
    if (ctx.currentProjectId || ctx.currentClientId) return AUTO_LINK_THRESHOLD - 0.05;
    return AUTO_LINK_THRESHOLD;
  }

  private buildClarification(candidates: { name: string; score: number; type: string }[]): string {
    const top = candidates.slice(0, 3);
    if (top.length === 1) {
      return `Did you mean "${top[0].name}" (${top[0].type})?`;
    }
    return `Did you mean: ${top.map((c) => `"${c.name}" (${c.type})`).join(", ")}?`;
  }

  private async gatherCandidates(ctx: ResolutionContext): Promise<(EntityCandidate & { score: number })[]> {
    const all: (EntityCandidate & { score: number })[] = [];
    const text = ctx.text;

    await Promise.all([
      this.searchClients(text, ctx.userId, all),
      this.searchProjects(text, ctx.userId, all),
      this.searchProblems(text, ctx.userId, all),
      this.searchConcepts(text, ctx.userId, all),
      this.searchCourses(text, ctx.userId, all),
      this.searchRoadmaps(text, ctx.userId, all),
      this.searchResources(text, ctx.userId, all),
      this.searchInvoices(text, ctx.userId, all),
      this.searchMemoryNodes(text, ctx.userId, all),
    ]);

    return all;
  }

  private async searchClients(text: string, userId: string, acc: (EntityCandidate & { score: number })[]): Promise<void> {
    const { data } = await this.repos.rawClient
      .from("clients")
      .select("id, name")
      .eq("user_id", userId)
      .neq("status", "inactive");
    if (data) {
      for (const c of data) {
        const score = fuzzyMatch(text, c.name);
        if (score >= AMBIGUOUS_THRESHOLD) {
          acc.push({ type: "client", id: c.id, name: c.name, aliases: [], href: `/clients/${c.id}`, score });
        }
      }
    }
  }

  private async searchProjects(text: string, userId: string, acc: (EntityCandidate & { score: number })[]): Promise<void> {
    const { data } = await this.repos.rawClient
      .from("projects")
      .select("id, title, description")
      .eq("user_id", userId)
      .neq("status", "archived");
    if (data) {
      for (const p of data) {
        const score = fuzzyMatch(text, p.title);
        if (score >= AMBIGUOUS_THRESHOLD) {
          acc.push({ type: "project", id: p.id, name: p.title, aliases: [], context: p.description ?? undefined, href: `/projects/${p.id}`, score });
        }
      }
    }
  }

  private async searchProblems(text: string, userId: string, acc: (EntityCandidate & { score: number })[]): Promise<void> {
    const { data } = await this.repos.rawClient
      .from("problems")
      .select("id, title, platform")
      .eq("user_id", userId);
    if (data) {
      for (const p of data) {
        const score = fuzzyMatch(text, p.title);
        if (score >= AMBIGUOUS_THRESHOLD) {
          acc.push({ type: "problem", id: p.id, name: p.title, aliases: [p.platform ?? ""], href: `/problems/${p.id}`, score });
        }
      }
    }
  }

  private async searchConcepts(text: string, userId: string, acc: (EntityCandidate & { score: number })[]): Promise<void> {
    const { data } = await this.repos.rawClient
      .from("concept_notes")
      .select("id, title")
      .eq("user_id", userId);
    if (data) {
      for (const c of data) {
        const score = fuzzyMatch(text, c.title);
        if (score >= AMBIGUOUS_THRESHOLD) {
          acc.push({ type: "concept", id: c.id, name: c.title, aliases: [], href: `/concepts/${c.id}`, score });
        }
      }
    }
  }

  private async searchCourses(text: string, userId: string, acc: (EntityCandidate & { score: number })[]): Promise<void> {
    const { data } = await this.repos.rawClient
      .from("iit_courses")
      .select("id, name, code")
      .eq("user_id", userId);
    if (data) {
      for (const c of data) {
        const titleScore = fuzzyMatch(text, c.name);
        const codeScore = c.code ? fuzzyMatch(text, c.code) : 0;
        const score = Math.max(titleScore, codeScore);
        if (score >= AMBIGUOUS_THRESHOLD) {
          acc.push({ type: "course", id: c.id, name: c.name, aliases: c.code ? [c.code] : [], href: `/iit-workspace`, score });
        }
      }
    }
  }

  private async searchRoadmaps(text: string, userId: string, acc: (EntityCandidate & { score: number })[]): Promise<void> {
    const { data } = await this.repos.rawClient
      .from("roadmaps")
      .select("id, title")
      .eq("user_id", userId);
    if (data) {
      for (const r of data) {
        const score = fuzzyMatch(text, r.title);
        if (score >= AMBIGUOUS_THRESHOLD) {
          acc.push({ type: "roadmap", id: r.id, name: r.title, aliases: [], href: `/roadmaps`, score });
        }
      }
    }
  }

  private async searchResources(text: string, userId: string, acc: (EntityCandidate & { score: number })[]): Promise<void> {
    const { data } = await this.repos.rawClient
      .from("resources")
      .select("id, title, resource_type")
      .eq("user_id", userId);
    if (data) {
      for (const r of data) {
        const score = fuzzyMatch(text, r.title);
        if (score >= AMBIGUOUS_THRESHOLD) {
          acc.push({ type: "resource", id: r.id, name: r.title, aliases: [r.resource_type ?? ""], href: `/resources/${r.id}`, score });
        }
      }
    }
  }

  private async searchInvoices(text: string, userId: string, acc: (EntityCandidate & { score: number })[]): Promise<void> {
    const { data } = await this.repos.rawClient
      .from("invoices")
      .select("id, invoice_number, client_id")
      .eq("user_id", userId);
    if (data) {
      for (const inv of data) {
        const score = fuzzyMatch(text, `invoice ${inv.invoice_number}`);
        if (score >= AMBIGUOUS_THRESHOLD) {
          acc.push({ type: "invoice", id: inv.id, name: `Invoice ${inv.invoice_number}`, aliases: [inv.invoice_number], href: `/invoices`, score });
        }
      }
    }
  }

  private async searchMemoryNodes(text: string, userId: string, acc: (EntityCandidate & { score: number })[]): Promise<void> {
    const { data } = await this.repos.rawClient
      .from("memory_nodes")
      .select("id, name, node_type")
      .eq("user_id", userId);
    if (data) {
      for (const n of data) {
        const score = fuzzyMatch(text, n.name);
        if (score >= AMBIGUOUS_THRESHOLD) {
          const entityType = this.mapNodeTypeToEntityType(n.node_type);
          acc.push({
            type: entityType,
            id: n.id,
            name: n.name,
            aliases: [n.node_type],
            context: n.node_type,
            href: `/memory/${n.id}`,
            score,
          });
        }
      }
    }
  }

  private mapNodeTypeToEntityType(nodeType: string): EntityType {
    const map: Record<string, EntityType> = {
      technology: "technology",
      person: "client",
      topic: "concept",
      project: "project",
    };
    return map[nodeType] ?? "resource";
  }
}
