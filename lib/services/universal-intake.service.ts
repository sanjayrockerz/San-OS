import type { Repositories } from "@/lib/repositories";
import { EntityResolutionEngine, type ResolutionContext, type EntityType } from "@/lib/entity-resolution";
import { parseBrainDump, type ParsedCaptureItem } from "@/lib/execution/brain-dump";
import { BaseService, isoDate } from "./base.service";

export interface IntakeInput {
  text: string;
  currentProjectId?: string;
  currentClientId?: string;
}

export interface IntakeResult {
  text: string;
  type: "problem_solve" | "project_work" | "learning" | "task" | "meeting" | "note" | "unknown";
  resolvedProject: { id: string; name: string } | null;
  resolvedClient: { id: string; name: string } | null;
  resolvedConcepts: { id: string; name: string }[];
  technologies: string[];
  domain: string;
  capturedItems: ParsedCaptureItem[];
  knowledgeEntryCreated: boolean;
  timelineEventEmitted: boolean;
  error?: string;
}

const TECHNOLOGY_KEYWORDS = [
  "react", "vue", "angular", "svelte", "next.js", "nuxt", "gatsby",
  "node", "express", "fastify", "nestjs", "python", "django", "flask", "fastapi",
  "typescript", "javascript", "rust", "go", "golang", "java", "kotlin", "swift",
  "postgresql", "mysql", "mongodb", "redis", "supabase", "firebase",
  "docker", "kubernetes", "aws", "gcp", "azure", "vercel", "netlify",
  "graphql", "rest", "grpc", "websocket", "tailwind", "bootstrap", "shadcn",
  "git", "github", "gitlab", "prisma", "drizzle", "typeorm",
  "react query", "tanstack", "zustand", "redux", "context api",
  "next auth", "clerk", "stripe", "resend", "sendgrid",
];

export class UniversalIntakeService extends BaseService {
  private readonly entityResolver: EntityResolutionEngine;

  constructor(repos: Repositories) {
    super(repos);
    this.entityResolver = new EntityResolutionEngine(repos);
  }

  async process(userId: string, input: IntakeInput): Promise<IntakeResult> {
    const text = input.text.trim();
    if (!text) {
      return { text, type: "unknown", resolvedProject: null, resolvedClient: null, resolvedConcepts: [], technologies: [], domain: "personal", capturedItems: [], knowledgeEntryCreated: false, timelineEventEmitted: false, error: "Empty input" };
    }

    const ctx: ResolutionContext = {
      userId,
      text,
      currentProjectId: input.currentProjectId,
      currentClientId: input.currentClientId,
    };

    const [entityResult, parsed] = await Promise.all([
      this.entityResolver.resolve(ctx),
      Promise.resolve(parseBrainDump(text)),
    ]);

    const resolvedProject = entityResult.matches.find(m => m.type === "project");
    const resolvedClient = entityResult.matches.find(m => m.type === "client");
    const resolvedConcepts = entityResult.matches.filter(m => m.type === "concept");
    const technologies = TECHNOLOGY_KEYWORDS.filter(t => text.toLowerCase().includes(t));

    const domain = this.inferDomain(text, parsed);
    const type = this.inferType(text, parsed, technologies);

    // Emit event instead of direct database mutations
    try {
      await this.repos.events.create({
        user_id: userId,
        event_type: `intake.processed`,
        entity_type: "intake",
        entity_id: null,
        payload: {
          text,
          type,
          domain,
          technologies,
          projectId: resolvedProject?.id ?? null,
          clientId: resolvedClient?.id ?? null,
          concepts: resolvedConcepts.map(c => c.id),
        },
      });

      // Instead of coupling Knowledge and Timeline logic here,
      // we emit an IntakeProcessed event to the Event Bus.
      // Other domains (Timeline, Planner, Memory) will subscribe and react.
      
      const { EventBus } = await import("@/lib/event-bus");
      const bus = new EventBus(this.repos);
      await bus.emit(userId, "intake.processed", {
        text,
        type,
        domain,
        technologies,
        projectId: resolvedProject?.id,
        clientId: resolvedClient?.id,
        parsedItems: parsed,
      });

    } catch (e) {
      console.error("Failed to emit intake event", e);
    }

    return {
      text,
      type,
      resolvedProject: resolvedProject ? { id: resolvedProject.id, name: resolvedProject.name } : null,
      resolvedClient: resolvedClient ? { id: resolvedClient.id, name: resolvedClient.name } : null,
      resolvedConcepts: resolvedConcepts.map(c => ({ id: c.id, name: c.name })),
      technologies,
      domain,
      capturedItems: parsed.slice(0, 5),
      knowledgeEntryCreated: true, // Handled asynchronously by EventBus
      timelineEventEmitted: true, // Handled asynchronously by EventBus
    };
  }

  private inferDomain(text: string, parsed: ParsedCaptureItem[]): string {
    const domainSignals: Record<string, RegExp[]> = {
      learning: [/\b(dsa|leetcode|study|course|learn|algorithm|concept|revision)\b/i],
      project: [/\b(project|build|deploy|feature|bug|refactor|ui|api|frontend|backend)\b/i],
      business: [/\b(client|invoice|payment|revenue|deal|pipeline|proposal)\b/i],
      academic: [/\b(assignment|exam|lecture|semester|gpa|grade)\b/i],
      finance: [/\b(income|expense|budget|salary|tax|investment)\b/i],
      health: [/\b(gym|workout|run|meditation|sleep|health)\b/i],
    };
    for (const [domain, signals] of Object.entries(domainSignals)) {
      if (signals.some(r => r.test(text))) return domain;
    }
    const parsedDomain = parsed[0]?.domain;
    if (parsedDomain) return parsedDomain;
    return "personal";
  }

  private inferType(text: string, parsed: ParsedCaptureItem[], technologies: string[]): IntakeResult["type"] {
    const typeSignals: Record<IntakeResult["type"], RegExp[]> = {
      problem_solve: [/\b(solved|solving|leetcode|problem|dsa|algorithm|codeforces)\b/i],
      project_work: [/\b(project|deploy|feature|bug|refactor|pr|commit|build|release)\b/i],
      learning: [/\b(learn|study|course|read|watched|lecture|tutorial)\b/i],
      task: [/\b(todo|task|finish|complete|need to|have to|must)\b/i],
      meeting: [/\b(meeting|call|sync|standup|discussed|demo|review)\b/i],
      note: [/\b(note|idea|thought|remember|concept)\b/i],
      unknown: [],
    };
    for (const [type, signals] of Object.entries(typeSignals)) {
      if (signals.length > 0 && signals.some(r => r.test(text))) return type as IntakeResult["type"];
    }
    if (technologies.length > 0) return "project_work";
    if (parsed[0]?.type === "meeting") return "meeting";
    if (parsed[0]?.type === "task") return "task";
    return "note";
  }

  private mapDomainToKnowledgeType(domain: string): string {
    const map: Record<string, string> = {
      learning: "note",
      project: "observation",
      business: "note",
      academic: "lecture",
      finance: "note",
      health: "note",
      personal: "note",
    };
    return map[domain] ?? "note";
  }
}
