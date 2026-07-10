import { BaseService } from "./base.service";
import type { Repositories } from "@/lib/repositories";

export interface SearchResult {
  id: string;
  type: "resource" | "problem" | "project" | "client" | "memory" | "concept" | "knowledge" | "course" | "assignment" | "invoice";
  title: string;
  description?: string;
  url: string;
  metadata?: any;
}

export class UniversalSearchService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async search(userId: string, query: string, limit = 20): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    const q = query.toLowerCase();
    let targetType: string | null = null;
    if (q.includes("meeting")) targetType = "meeting";
    if (q.includes("invoice") || q.includes("money") || q.includes("paid")) targetType = "finance";
    if (q.includes("resource") || q.includes("pdf")) targetType = "resource";
    if (q.includes("assignment") || q.includes("homework")) targetType = "assignment";
    if (q.includes("course") || q.includes("class") || q.includes("lecture")) targetType = "course";
    if (q.includes("client") || q.includes("customer")) targetType = "client";

    const searchPattern = `%${query}%`;

    // 1. Resources
    const { data: resources } = await this.repos.rawClient
      .from("resources")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(limit);

    if (resources) {
      resources.forEach(r => {
        let score = 1;
        if (targetType === "resource") score += 5;
        if (targetType === "meeting" && r.title.toLowerCase().includes("meeting")) score += 5;
        if (targetType === "finance" && r.title.toLowerCase().includes("invoice")) score += 5;

        results.push({
          id: r.id,
          type: "resource",
          title: r.title,
          description: r.description || undefined,
          url: `/resources/${r.id}`,
          metadata: { type: r.resource_type, score }
        });
      });
    }

    // 2. Memory Nodes
    const { data: nodes } = await this.repos.rawClient
      .from("memory_nodes")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", searchPattern)
      .limit(limit);

    if (nodes) {
      nodes.forEach(n => {
        results.push({
          id: n.id,
          type: "memory",
          title: `${n.node_type}: ${n.name}`,
          url: `/memory/${n.id}`,
          metadata: { type: n.node_type, score: 3 }
        });
      });
    }

    // 3. Problems
    const { data: problems } = await this.repos.rawClient
      .from("problems")
      .select("*")
      .eq("user_id", userId)
      .ilike("title", searchPattern)
      .limit(limit);

    if (problems) {
      problems.forEach(p => results.push({
        id: p.id,
        type: "problem",
        title: p.title,
        url: `/problems/${p.id}`,
        metadata: { platform: p.platform, score: 2 }
      }));
    }

    // 4. Projects
    const { data: projects } = await this.repos.rawClient
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(limit);

    if (projects) {
      projects.forEach(p => results.push({
        id: p.id,
        type: "project",
        title: p.title,
        description: p.description || undefined,
        url: `/projects/${p.id}`,
        metadata: { score: 2 }
      }));
    }

    // 5. Concepts
    const { data: concepts } = await this.repos.rawClient
      .from("concept_notes")
      .select("*")
      .eq("user_id", userId)
      .ilike("title", searchPattern)
      .limit(limit);

    if (concepts) {
      concepts.forEach(c => results.push({
        id: c.id,
        type: "concept",
        title: c.title,
        url: `/concepts/${c.id}`,
        metadata: { score: 2 }
      }));
    }

    // 6. Knowledge Items
    const { data: knowledge } = await this.repos.rawClient
      .from("knowledge_items")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
      .limit(limit);

    if (knowledge) {
      knowledge.forEach(k => results.push({
        id: k.id,
        type: "knowledge",
        title: k.title,
        description: k.content?.slice(0, 200) || undefined,
        url: `/knowledge/${k.id}`,
        metadata: { type: k.type, score: 2 }
      }));
    }

    // 7. IIT Courses
    let targetScore = targetType === "course" ? 5 : 1;
    const { data: courses } = await this.repos.rawClient
      .from("iit_courses")
      .select("*")
      .eq("user_id", userId)
      .or(`name.ilike.${searchPattern},code.ilike.${searchPattern}`)
      .limit(limit);

    if (courses) {
      courses.forEach(c => results.push({
        id: c.id,
        type: "course",
        title: `${c.code ?? ""} ${c.name}`.trim(),
        description: `${c.semester ?? ""} — ${c.credits ?? 0} credits` || undefined,
        url: `/iit/courses/${c.id}`,
        metadata: { score: targetScore }
      }));
    }

    // 8. IIT Assignments
    targetScore = targetType === "assignment" ? 5 : 1;
    const { data: assignments } = await this.repos.rawClient
      .from("iit_assignments")
      .select("*")
      .eq("user_id", userId)
      .ilike("title", searchPattern)
      .limit(limit);

    if (assignments) {
      assignments.forEach(a => results.push({
        id: a.id,
        type: "assignment",
        title: a.title,
        description: a.status ? `Status: ${a.status}` : undefined,
        url: `/iit/assignments/${a.id}`,
        metadata: { status: a.status, score: targetScore }
      }));
    }

    // 9. Invoices
    targetScore = targetType === "finance" ? 5 : 1;
    const { data: invoices } = await this.repos.rawClient
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .or(`invoice_number.ilike.${searchPattern},notes.ilike.${searchPattern}`)
      .limit(limit);

    if (invoices) {
      invoices.forEach(inv => results.push({
        id: inv.id,
        type: "invoice",
        title: `${inv.invoice_number} — ₹${inv.total_amount}`,
        description: `Status: ${inv.status}, Due: ${inv.due_date ?? "N/A"}`,
        url: `/invoices/${inv.id}`,
        metadata: { status: inv.status, score: targetScore }
      }));
    }

    // 10. Clients
    targetScore = targetType === "client" ? 5 : 1;
    const { data: clients } = await this.repos.rawClient
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .or(`name.ilike.${searchPattern},email.ilike.${searchPattern},company.ilike.${searchPattern}`)
      .limit(limit);

    if (clients) {
      clients.forEach(c => results.push({
        id: c.id,
        type: "client",
        title: c.name,
        description: c.company || c.email || undefined,
        url: `/clients/${c.id}`,
        metadata: { score: targetScore }
      }));
    }

    return results.sort((a, b) => (b.metadata?.score || 0) - (a.metadata?.score || 0)).slice(0, limit);
  }

  async semanticSearch(userId: string, query: string, limit = 10): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      const { data: semanticResults, error } = await this.repos.rawClient.rpc(
        "match_semantic_items",
        { query_text: query, match_count: limit, p_user_id: userId },
      );

      if (!error && semanticResults) {
        for (const item of semanticResults as any[]) {
          results.push({
            id: item.id,
            type: item.entity_type ?? "knowledge",
            title: item.title ?? "",
            description: item.content ?? undefined,
            url: `/${item.entity_type ?? "knowledge"}/${item.id}`,
            metadata: { score: item.similarity ?? 0.5, semantic: true },
          });
        }
      }
    } catch {
      // fallback: if pgvector/semantic rpc unavailable, skip silently
    }

    return results;
  }

  async searchAll(userId: string, query: string, limit = 20): Promise<SearchResult[]> {
    const [lexical, semantic] = await Promise.all([
      this.search(userId, query, limit),
      this.semanticSearch(userId, query, limit),
    ]);

    const seen = new Set<string>();
    const merged: SearchResult[] = [];

    for (const r of [...semantic, ...lexical]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      merged.push(r);
    }

    return merged.slice(0, limit);
  }
}
