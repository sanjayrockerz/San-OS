import { BaseService } from "./base.service";
import type { Repositories } from "@/lib/repositories";

export interface SmartSuggestion {
  id: string;
  type: "collection_prompt" | "project_drift" | "academic_reminder" | "invoice_overdue" | "dsa_streak";
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  confidence: number;
}

export class SmartSuggestionsEngineService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async getSuggestionsForUser(userId: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // 1. Check for recent active projects without updates
    const projects = await this.repos.projects.findByUser(userId).catch(() => []);
    const activeProject = projects.find((p) => p.status === "active" || p.status === "planning");
    if (activeProject) {
      suggestions.push({
        id: `sug-proj-${activeProject.id}`,
        type: "project_drift",
        title: `Project Progress: ${activeProject.title}`,
        description: `You've worked on ${activeProject.title} recently. Record a milestone update or log hours?`,
        actionLabel: "Log Progress",
        actionHref: `/projects/${activeProject.id}`,
        confidence: 0.88,
      });
    }

    // 2. Check for resource knowledge collection opportunity
    const resources = await this.repos.resources.findByUser(userId).catch(() => []);
    const pdfs = resources.filter((r) => r.type === "pdf" || r.resource_type === "pdf");
    if (pdfs.length >= 2) {
      suggestions.push({
        id: "sug-knowledge-rag",
        type: "collection_prompt",
        title: "Create Knowledge Collection?",
        description: `You uploaded ${pdfs.length} PDF documents recently. Group them into a study collection?`,
        actionLabel: "View Knowledge Vault",
        actionHref: "/knowledge-vault",
        confidence: 0.92,
      });
    }

    // 3. Academic reminder prompt
    suggestions.push({
      id: "sug-academic-iit",
      type: "academic_reminder",
      title: "IIT Semester Goal Track",
      description: "Completing today's IIT assignment keeps you on track for your semester target.",
      actionLabel: "Open IIT Workspace",
      actionHref: "/iit-workspace",
      confidence: 0.85,
    });

    return suggestions;
  }
}
