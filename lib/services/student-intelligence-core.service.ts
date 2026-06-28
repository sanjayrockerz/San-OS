import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { type AcademicAction, AcademicCoachService } from "./academic-coach.service";
import { type ProjectAction, ProjectCoachService } from "./project-coach.service";
import { type BusinessAction, BusinessCoachService } from "./business-coach.service";
import { type RoadmapAction, RoadmapCoachService } from "./roadmap-coach.service";
import { BaseService } from "./base.service";
import { HabitEngineService, type MissedWorkItem } from "./habit-engine.service";
import { type KnowledgeAction, KnowledgeCoachService } from "./knowledge-coach.service";
import {
  MemoryCoachService,
  type MemoryIntervention,
} from "./memory-coach.service";
import { RevisionService } from "./revision.service";
import { scoreAction } from "./student-action-scoring";
import { TaxonomyService } from "./taxonomy.service";

/** One actionable step in the Daily Battle Plan — kept for AiService back-compat. */
export interface BattlePlanStep {
  kind: "revise" | "strengthen" | "learn" | "academic";
  title: string;
  detail: string;
  entityId?: string;
}

/**
 * A prioritised card in the "Continue Learning" panel.
 * Priority: revision (1) > concept (2) > vault (3) > problem (4) > iit (5)
 */
export interface ResumeItem {
  type: "revision" | "concept" | "vault" | "problem" | "iit";
  priority: number;
  title: string;
  reason: string;
  href: string;
  estimatedMinutes: number;
  lastTouchedAt: string | null;
  entityId: string | null;
}

/** A rule-derived recommendation the app surfaces to the user. */
export interface Recommendation {
  id: string;
  title: string;
  body: string;
  href: string | null;
  actionLabel: string;
  priority: number;
}

/** A single actionable task in the daily session orchestrator. */
export interface SessionTask {
  id: string;
  type: "revision" | "concept" | "problem" | "iit" | "roadmap";
  title: string;
  estimatedMinutes: number;
  href: string;
}

/**
 * One candidate action the student could take right now, scored on a single
 * shared rubric so heterogeneous signals (a due revision, a decaying topic, an
 * overdue assignment, a taxonomy proposal) can be ranked against each other.
 */
export interface StudentAction {
  id: string;
  kind:
    | "revise_problem"
    | "strengthen_problem"
    | "review_concept"
    | "review_resource"
    | "solve_new"
    | "resume_problem"
    | "link_vault_item"
    | "approve_taxonomy"
    | "complete_assignment"
    | "address_missed_work"
    | "create_concept_note"
    | "link_pattern"
    | "review_course"
    | "complete_project_task"
    | "review_project_milestone"
    | "collect_invoice"
    | "advance_pipeline"
    | "resume_roadmap";
  source:
    | "revision"
    | "memory"
    | "habit"
    | "iit"
    | "taxonomy"
    | "knowledge"
    | "project"
    | "business"
    | "roadmap";
  title: string;
  detail: string;
  href: string;
  entityId: string | null;
  estimatedMinutes: number;
  /** 0-1: how time-sensitive this action is right now. */
  urgency: number;
  /** 0-1: how much this action moves a weak/important area vs. an isolated one. */
  impact: number;
  /** 0-1: whether doing this preserves/builds a streak or daily habit. */
  momentum: number;
  /** 0-100 composite score — the single ranking key every formatter sorts on. */
  score: number;
  lastTouchedAt: string | null;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

/** One entity (topic, pattern, course, assignment, or piece of overdue work) the student is at risk on. */
export interface RiskEntry {
  entityType:
    | "topic"
    | "pattern"
    | "habit"
    | "concept"
    | "course"
    | "assignment"
    | "project"
    | "project_task"
    | "invoice"
    | "pipeline_entry"
    | "cgpa"
    | "roadmap";
  entityId: string;
  name: string;
  riskLevel: RiskLevel;
  reason: string;
  recommendedAction: { label: string; href: string; entityId: string | null };
}

export interface RiskRegister {
  /** 0-100, higher = more at risk overall. */
  overallRiskScore: number;
  entries: RiskEntry[];
}

/** A short, time-boxed bundle of 2-4 prioritised actions. */
export interface Mission {
  id: string;
  title: string;
  estimatedMinutes: number;
  actions: StudentAction[];
}

export interface StudentIntelligenceSnapshot {
  priorities: StudentAction[];
  risks: RiskRegister;
  missions: Mission[];
  battlePlan: BattlePlanStep[];
  continueLearning: ResumeItem[];
  recommendations: Recommendation[];
  dailyPlan: SessionTask[];
}

const RISK_WEIGHT: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** Maps a {@link StudentAction} kind to its battle-plan bucket. Shared with focus-mode filtering of priorities/missions outside this service. */
export const ACTION_KIND_TO_BATTLE_KIND: Partial<
  Record<StudentAction["kind"], BattlePlanStep["kind"]>
> = {
  revise_problem: "revise",
  strengthen_problem: "strengthen",
  review_concept: "learn",
  solve_new: "learn",
  complete_assignment: "academic",
  review_course: "academic",
};

/** One-click CTA label for a {@link StudentAction} kind. Shared with UI surfaces beyond recommendations. */
export const ACTION_LABEL_BY_KIND: Partial<Record<StudentAction["kind"], string>> = {
  revise_problem: "Start revision",
  strengthen_problem: "Strengthen",
  review_concept: "Review concept",
  review_resource: "Open resource",
  solve_new: "Solve a problem",
  resume_problem: "Resume",
  link_vault_item: "Open vault",
  approve_taxonomy: "Review proposals",
  complete_assignment: "Open assignment",
  address_missed_work: "Resolve",
  create_concept_note: "Write concept note",
  link_pattern: "Link pattern",
  review_course: "Review course",
  complete_project_task: "Open task",
  review_project_milestone: "Review milestone",
  collect_invoice: "Open invoices",
  advance_pipeline: "Open pipeline",
  resume_roadmap: "Continue roadmap",
};

const CACHE_TTL_MS = 15_000;

interface GatheredSignals {
  due: Tables<"revision_queue">[];
  weak: Tables<"revision_queue">[];
  problems: Tables<"problems">[];
  attempts: Tables<"problem_attempts">[];
  concepts: Tables<"concept_notes">[];
  knowledge: Tables<"knowledge_items">[];
  upcomingAssignments: Tables<"iit_assignments">[];
  memoryInterventions: MemoryIntervention[];
  taxonomyProposalCount: number;
  missedWork: MissedWorkItem[];
  knowledgeGaps: KnowledgeAction[];
  academicActions: AcademicAction[];
  academicRisks: RiskEntry[];
  projectActions: ProjectAction[];
  projectRisks: RiskEntry[];
  businessActions: BusinessAction[];
  businessRisks: RiskEntry[];
  roadmapActions: RoadmapAction[];
  roadmapRisks: RiskEntry[];
}

/**
 * StudentIntelligenceCore — the single source of truth for "where this
 * student stands and what they should do next." It does not replace
 * RevisionService, MemoryIntelligenceService, TaxonomyService, HabitEngineService
 * etc. — those remain the systems of record for their domain and are called
 * here as signal providers, never re-implemented. The Core's only original
 * logic is the cross-domain ranking function (urgency/impact/momentum →
 * score) that turns those heterogeneous signals into one ordered action list,
 * from which every legacy output (battle plan, continue-learning, recommendations,
 * daily plan, risk register, missions) is formatted/filtered — not separately
 * recomputed.
 */
export class StudentIntelligenceCoreService extends BaseService {
  private readonly revision: RevisionService;
  private readonly memoryCoach: MemoryCoachService;
  private readonly taxonomy: TaxonomyService;
  private readonly habitEngine: HabitEngineService;
  private readonly knowledgeCoach: KnowledgeCoachService;
  private readonly academicCoach: AcademicCoachService;
  private readonly projectCoach: ProjectCoachService;
  private readonly businessCoach: BusinessCoachService;
  private readonly roadmapCoach: RoadmapCoachService;

  private static readonly cache = new Map<
    string,
    { at: number; snapshot: StudentIntelligenceSnapshot }
  >();

  constructor(repos: Repositories) {
    super(repos);
    this.revision = new RevisionService(repos);
    this.memoryCoach = new MemoryCoachService(repos);
    this.taxonomy = new TaxonomyService(repos);
    this.habitEngine = new HabitEngineService(repos);
    this.knowledgeCoach = new KnowledgeCoachService(repos);
    this.academicCoach = new AcademicCoachService(repos);
    this.roadmapCoach = new RoadmapCoachService(repos);
    this.projectCoach = new ProjectCoachService(repos);
    this.businessCoach = new BusinessCoachService(repos);
  }

  /** Invalidate the cached snapshot for a user (call after a mutation if eager). */
  static invalidate(userId: string): void {
    StudentIntelligenceCoreService.cache.delete(userId);
  }

  /**
   * Computes the whole intelligence picture once and derives every consumer
   * shape from it. Cached briefly because a single page render can ask for
   * several of the derived shapes (battle plan, continue learning,
   * recommendations, daily plan) — they must all originate from the same pass.
   */
  async snapshot(userId: string, useCache = true): Promise<StudentIntelligenceSnapshot> {
    if (useCache) {
      const hit = StudentIntelligenceCoreService.cache.get(userId);
      if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.snapshot;
    }

    const signals = await this.gatherSignals(userId);
    const priorities = this.buildActions(signals);
    const risks = this.buildRiskRegister(signals);
    const missions = this.buildMissions(priorities);

    const result: StudentIntelligenceSnapshot = {
      priorities,
      risks,
      missions,
      battlePlan: this.toBattlePlan(priorities),
      continueLearning: this.toContinueLearning(priorities),
      recommendations: this.toRecommendations(priorities),
      dailyPlan: this.toDailyPlan(priorities),
    };

    StudentIntelligenceCoreService.cache.set(userId, { at: Date.now(), snapshot: result });
    return result;
  }

  /** The single ranked list of next actions — the one thing every other output derives from. */
  async priorities(userId: string): Promise<StudentAction[]> {
    return (await this.snapshot(userId)).priorities;
  }

  async risks(userId: string): Promise<RiskRegister> {
    return (await this.snapshot(userId)).risks;
  }

  async missions(userId: string): Promise<Mission[]> {
    return (await this.snapshot(userId)).missions;
  }

  /** Thin formatter over the ranked list — replaces AiService's own battle-plan computation. */
  async battlePlan(userId: string): Promise<BattlePlanStep[]> {
    return (await this.snapshot(userId)).battlePlan;
  }

  /** Thin formatter over the ranked list — replaces ContextEngineService.resumePriority. */
  async continueLearning(userId: string): Promise<ResumeItem[]> {
    return (await this.snapshot(userId)).continueLearning;
  }

  /** Thin formatter over the ranked list — replaces ContextEngineService.recommendations. */
  async recommendations(userId: string): Promise<Recommendation[]> {
    return (await this.snapshot(userId)).recommendations;
  }

  /** Thin formatter over the ranked list — replaces ContextEngineService.buildDailyPlan. */
  async dailyPlan(userId: string): Promise<SessionTask[]> {
    return (await this.snapshot(userId)).dailyPlan;
  }

  // ---------------------------------------------------------------------------
  // Signal gathering — every fetch here delegates to an existing system of
  // record; nothing below recomputes a score another service already owns.
  // ---------------------------------------------------------------------------

  private async gatherSignals(userId: string): Promise<GatheredSignals> {
    const nowIso = new Date().toISOString();
    const [
      due, weak, problems, attempts, concepts, knowledge,
      upcomingAssignments, memoryInterventions, taxonomyProposals,
      missedWork, knowledgeGaps, academicActions, academicRisks,
      projectActions, projectRisks, businessActions, businessRisks,
      roadmapActions, roadmapRisks,
    ] = await Promise.all([
      safe(this.revision.dueQueue(userId), []),
      safe(this.revision.weakQueue(userId), []),
      safe(this.repos.problems.listVisible(userId), []),
      safe(this.repos.attempts.findByUser(userId), []),
      safe(this.repos.concepts.findByUser(userId), []),
      safe(this.repos.knowledge.recent(userId, 10), []),
      safe(this.repos.iitAssignments.upcoming(userId, nowIso), []),
      safe(this.memoryCoach.interventions(userId), []),
      safe(this.taxonomy.listProposals(userId), { topics: [], patterns: [] }),
      safe(this.habitEngine.getMissedWorkQueue(userId), []),
      safe(this.knowledgeCoach.actions(userId), []),
      safe(this.academicCoach.actions(userId), []),
      safe(this.academicCoach.risks(userId), []),
      safe(this.projectCoach.actions(userId), []),
      safe(this.projectCoach.risks(userId), []),
      safe(this.businessCoach.actions(userId), []),
      safe(this.businessCoach.risks(userId), []),
      safe(this.roadmapCoach.actions(userId), []),
      safe(this.roadmapCoach.risks(userId), []),
    ]);

    return {
      due,
      weak,
      problems,
      attempts,
      concepts,
      knowledge,
      upcomingAssignments,
      memoryInterventions,
      taxonomyProposalCount: taxonomyProposals.topics.length + taxonomyProposals.patterns.length,
      missedWork,
      knowledgeGaps,
      academicActions,
      academicRisks,
      projectActions,
      projectRisks,
      businessActions,
      businessRisks,
      roadmapActions,
      roadmapRisks,
    };
  }

  // ---------------------------------------------------------------------------
  // The one scoring pipeline — urgency/impact/momentum → score.
  // Weights (0.5 / 0.35 / 0.15) favour acting on what's due now, then on what's
  // tied to a weak area, with streak-preservation as a tie-breaker — not the
  // other way around, since a missed streak is recoverable but compounding
  // forgetting is not.
  // ---------------------------------------------------------------------------

  private buildActions(signals: GatheredSignals): StudentAction[] {
    const titleByProblem = new Map(signals.problems.map((p) => [p.id, p.title]));
    const seenProblemIds = new Set<string>();
    const actions: StudentAction[] = [];

    for (const item of signals.due.slice(0, 8)) {
      seenProblemIds.add(item.problem_id);
      actions.push(
        this.action({
          kind: "revise_problem",
          source: "revision",
          title: "Revise a due problem",
          detail: titleByProblem.get(item.problem_id) ?? "Due for spaced revision today.",
          href: "/revision",
          entityId: item.problem_id,
          estimatedMinutes: 8,
          urgency: 0.85,
          impact: 0.7,
          momentum: 0.8,
          lastTouchedAt: item.last_revision,
        }),
      );
    }

    for (const item of signals.weak.slice(0, 5)) {
      seenProblemIds.add(item.problem_id);
      actions.push(
        this.action({
          kind: "strengthen_problem",
          source: "revision",
          title: "Strengthen a weak problem",
          detail: `"${titleByProblem.get(item.problem_id) ?? "Untitled problem"}" is in your struggling queue.`,
          href: `/problems/${item.problem_id}`,
          entityId: item.problem_id,
          estimatedMinutes: 15,
          urgency: 0.6,
          impact: 0.7,
          momentum: 0.5,
          lastTouchedAt: item.last_revision,
        }),
      );
    }

    for (const intervention of signals.memoryInterventions.slice(0, 5)) {
      const first = intervention.actions[0];
      if (!first) continue;
      const isNeglectedOrDecaying =
        intervention.status === "neglected" || intervention.status === "decaying";
      actions.push(
        this.action({
          kind: first.kind,
          source: "memory",
          title: first.label,
          detail: intervention.reason,
          href: hrefForMemoryAction(first),
          entityId: first.entityId ?? null,
          estimatedMinutes: 12,
          urgency: isNeglectedOrDecaying ? 0.85 : 0.55,
          impact: 0.75,
          momentum: 0.4,
          lastTouchedAt: null,
        }),
      );
    }

    for (const c of signals.concepts.filter((c) => c.status === "forgotten").slice(0, 3)) {
      actions.push(
        this.action({
          kind: "review_concept",
          source: "memory",
          title: `Re-learn: ${c.title}`,
          detail: "This concept is marked forgotten in your vault.",
          href: `/concepts/${c.id}`,
          entityId: c.id,
          estimatedMinutes: 10,
          urgency: 0.5,
          impact: 0.6,
          momentum: 0.3,
          lastTouchedAt: c.updated_at,
        }),
      );
    }

    for (const c of signals.concepts
      .filter((c) => c.status === "learning" || c.status === "weak")
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 2)) {
      actions.push(
        this.action({
          kind: "review_concept",
          source: "knowledge",
          title: c.title,
          detail:
            c.status === "weak"
              ? "Marked as weak — needs reinforcement."
              : "In-progress concept note.",
          href: `/concepts/${c.id}`,
          entityId: c.id,
          estimatedMinutes: 10,
          urgency: 0.4,
          impact: 0.55,
          momentum: 0.3,
          lastTouchedAt: c.updated_at,
        }),
      );
    }

    for (const item of signals.missedWork.slice(0, 5)) {
      actions.push(
        this.action({
          kind: "address_missed_work",
          source: "habit",
          title: `Overdue: ${item.title}`,
          detail: `${item.overdueDays} day${item.overdueDays === 1 ? "" : "s"} overdue.`,
          href: hrefForMissedWork(item),
          entityId: item.sourceId,
          estimatedMinutes: 10,
          urgency: clamp01(0.5 + item.overdueDays * 0.08),
          impact: 0.55,
          momentum: 0.3,
          lastTouchedAt: item.dueAt,
        }),
      );
    }

    for (const a of signals.upcomingAssignments
      .filter((a) => a.status === "pending")
      .slice(0, 3)) {
      const daysUntil = a.due_date
        ? Math.ceil((new Date(a.due_date).getTime() - Date.now()) / 86400000)
        : null;
      actions.push(
        this.action({
          kind: "complete_assignment",
          source: "iit",
          title: `Complete ${a.title}`,
          detail:
            daysUntil !== null
              ? `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`
              : "Upcoming assignment.",
          href: "/iit-workspace",
          entityId: a.id,
          estimatedMinutes: 20,
          urgency: daysUntil !== null ? clamp01(1 - daysUntil / 7) : 0.4,
          impact: 0.6,
          momentum: 0.3,
          lastTouchedAt: null,
        }),
      );
    }

    if (signals.taxonomyProposalCount > 0) {
      actions.push(
        this.action({
          kind: "approve_taxonomy",
          source: "taxonomy",
          title: `${signals.taxonomyProposalCount} taxonomy proposal(s) waiting`,
          detail: "Topics/patterns mined from your notes are waiting for review.",
          href: "/taxonomy",
          entityId: null,
          estimatedMinutes: 5,
          urgency: 0.2,
          impact: 0.3,
          momentum: 0.2,
          lastTouchedAt: null,
        }),
      );
    }

    const recentAttempted = [...signals.attempts]
      .sort(
        (a, b) =>
          new Date(b.attempted_at ?? b.created_at).getTime() -
          new Date(a.attempted_at ?? a.created_at).getTime(),
      )
      .filter((a) => !seenProblemIds.has(a.problem_id));
    const seenResume = new Set<string>();
    for (const a of recentAttempted) {
      if (seenResume.has(a.problem_id)) continue;
      seenResume.add(a.problem_id);
      actions.push(
        this.action({
          kind: "resume_problem",
          source: "revision",
          title: titleByProblem.get(a.problem_id) ?? "Problem",
          detail: "Recently worked on.",
          href: `/problems/${a.problem_id}`,
          entityId: a.problem_id,
          estimatedMinutes: 25,
          urgency: 0.35,
          impact: 0.5,
          momentum: 0.5,
          lastTouchedAt: a.attempted_at ?? a.created_at,
        }),
      );
      if (seenResume.size >= 2) break;
    }

    for (const gap of signals.knowledgeGaps.slice(0, 5)) {
      actions.push(gap);
    }

    for (const action of signals.academicActions) {
      actions.push(action);
    }

    for (const action of signals.projectActions) {
      actions.push(action);
    }

    for (const action of signals.businessActions) {
      actions.push(action);
    }

    for (const action of signals.roadmapActions) {
      actions.push(action);
    }

    for (const k of signals.knowledge.slice(0, 2)) {
      actions.push(
        this.action({
          kind: "link_vault_item",
          source: "knowledge",
          title: k.title,
          detail: "Recently saved — link it to a problem or concept.",
          href: "/vault",
          entityId: k.id,
          estimatedMinutes: 5,
          urgency: 0.25,
          impact: 0.35,
          momentum: 0.2,
          lastTouchedAt: k.created_at,
        }),
      );
    }

    return dedupe(actions).sort((a, b) => b.score - a.score);
  }

  private action(input: Omit<StudentAction, "id" | "score">): StudentAction {
    return {
      ...input,
      id: `${input.kind}-${input.entityId ?? input.title}`,
      score: scoreAction(input),
    };
  }

  // ---------------------------------------------------------------------------
  // Risk register — folds memory health and missed work into one list keyed
  // by entity, replacing the three disjoint risk lists the audit identified.
  // ---------------------------------------------------------------------------

  private buildRiskRegister(signals: GatheredSignals): RiskRegister {
    const entries: RiskEntry[] = [];

    for (const intervention of signals.memoryInterventions) {
      const riskLevel: RiskLevel =
        intervention.status === "neglected"
          ? "critical"
          : intervention.status === "decaying"
            ? "high"
            : "medium";
      const action = intervention.actions[0];
      entries.push({
        entityType: intervention.entityType,
        entityId: intervention.entityId,
        name: intervention.name,
        riskLevel,
        reason: intervention.reason,
        recommendedAction: {
          label: action?.label ?? `Review ${intervention.name}`,
          href: action ? hrefForMemoryAction(action) : "/revision",
          entityId: action?.entityId ?? null,
        },
      });
    }

    for (const item of signals.missedWork) {
      const riskLevel: RiskLevel =
        item.overdueDays >= 7 ? "critical" : item.overdueDays >= 3 ? "high" : "medium";
      entries.push({
        entityType: "habit",
        entityId: item.notificationId,
        name: item.title,
        riskLevel,
        reason: `${item.overdueDays} day${item.overdueDays === 1 ? "" : "s"} overdue.`,
        recommendedAction: {
          label: `Resolve: ${item.title}`,
          href: hrefForMissedWork(item),
          entityId: item.sourceId,
        },
      });
    }

    for (const gap of signals.knowledgeGaps.filter((g) => g.severity === "high")) {
      entries.push({
        entityType: gap.entityType,
        entityId: gap.entityId ?? gap.id,
        name: gap.title,
        riskLevel: "high",
        reason: gap.detail,
        recommendedAction: { label: gap.title, href: gap.href, entityId: gap.entityId },
      });
    }

    for (const entry of signals.academicRisks) {
      entries.push(entry);
    }

    for (const entry of signals.projectRisks) {
      entries.push(entry);
    }

    for (const entry of signals.businessRisks) {
      entries.push(entry);
    }

    for (const entry of signals.roadmapRisks) {
      entries.push(entry);
    }

    entries.sort((a, b) => RISK_WEIGHT[b.riskLevel] - RISK_WEIGHT[a.riskLevel]);

    const overallRiskScore = entries.length
      ? Math.round(
          (entries.reduce((sum, e) => sum + RISK_WEIGHT[e.riskLevel], 0) /
            (entries.length * RISK_WEIGHT.critical)) *
            100,
        )
      : 0;

    return { overallRiskScore, entries };
  }

  // ---------------------------------------------------------------------------
  // Mission Center — 2-4 time-boxed bundles, grouped by domain so a mission
  // stays coherent ("do these revision items") rather than a random top-N grab.
  // ---------------------------------------------------------------------------

  private buildMissions(priorities: StudentAction[]): Mission[] {
    const groups: { id: string; title: string; sources: StudentAction["source"][] }[] = [
      { id: "revision", title: "Today's Revision", sources: ["revision"] },
      { id: "memory", title: "Memory Repair", sources: ["memory"] },
      { id: "academic", title: "Academic Catch-Up", sources: ["iit"] },
      { id: "knowledge", title: "Knowledge Tidy-Up", sources: ["taxonomy", "knowledge"] },
      { id: "habit", title: "Clear the Backlog", sources: ["habit"] },
      { id: "project", title: "Project Work", sources: ["project"] },
      { id: "business", title: "Business Work", sources: ["business"] },
      { id: "roadmap", title: "Roadmap Progress", sources: ["roadmap"] },
    ];

    const missions: Mission[] = [];
    for (const group of groups) {
      const actions = priorities.filter((a) => group.sources.includes(a.source)).slice(0, 4);
      if (actions.length === 0) continue;
      missions.push({
        id: group.id,
        title: group.title,
        estimatedMinutes: actions.reduce((sum, a) => sum + a.estimatedMinutes, 0),
        actions,
      });
    }

    return missions
      .sort((a, b) => (b.actions[0]?.score ?? 0) - (a.actions[0]?.score ?? 0))
      .slice(0, 4);
  }

  // ---------------------------------------------------------------------------
  // Formatters — every legacy shape is a view over the one ranked list above.
  // ---------------------------------------------------------------------------

  private toBattlePlan(priorities: StudentAction[]): BattlePlanStep[] {
    const kindMap = ACTION_KIND_TO_BATTLE_KIND;
    const caps: Record<BattlePlanStep["kind"], number> = {
      revise: 5,
      strengthen: 3,
      learn: 3,
      academic: 3,
    };
    const counts: Record<BattlePlanStep["kind"], number> = {
      revise: 0,
      strengthen: 0,
      learn: 0,
      academic: 0,
    };

    const steps: BattlePlanStep[] = [];
    for (const action of priorities) {
      const kind = kindMap[action.kind];
      if (!kind || counts[kind] >= caps[kind]) continue;
      counts[kind] += 1;
      steps.push({
        kind,
        title: action.title,
        detail: action.detail,
        entityId: action.entityId ?? undefined,
      });
    }
    return steps;
  }

  private toContinueLearning(priorities: StudentAction[]): ResumeItem[] {
    const typeMap: Partial<Record<StudentAction["kind"], ResumeItem["type"]>> = {
      revise_problem: "revision",
      strengthen_problem: "revision",
      review_concept: "concept",
      review_resource: "vault",
      link_vault_item: "vault",
      resume_problem: "problem",
      solve_new: "problem",
      complete_assignment: "iit",
    };
    const priorityRank: Record<ResumeItem["type"], number> = {
      revision: 1,
      concept: 2,
      vault: 3,
      problem: 4,
      iit: 5,
    };

    const items: ResumeItem[] = [];
    const perType = new Map<ResumeItem["type"], number>();
    for (const action of priorities) {
      const type = typeMap[action.kind];
      if (!type) continue;
      const count = perType.get(type) ?? 0;
      if (count >= 3) continue;
      perType.set(type, count + 1);
      items.push({
        type,
        priority: priorityRank[type],
        title: action.title,
        reason: action.detail,
        href: action.href,
        estimatedMinutes: action.estimatedMinutes,
        lastTouchedAt: action.lastTouchedAt,
        entityId: action.entityId,
      });
      if (items.length >= 10) break;
    }
    return items.sort((a, b) => a.priority - b.priority);
  }

  private toRecommendations(priorities: StudentAction[]): Recommendation[] {
    const recs: Recommendation[] = [];
    const seenKinds = new Set<string>();
    for (const action of priorities) {
      if (seenKinds.has(action.kind)) continue;
      seenKinds.add(action.kind);
      recs.push({
        id: action.id,
        title: action.title,
        body: action.detail,
        href: action.href,
        actionLabel: ACTION_LABEL_BY_KIND[action.kind] ?? "Open",
        priority: recs.length + 1,
      });
      if (recs.length >= 5) break;
    }
    return recs;
  }

  private toDailyPlan(priorities: StudentAction[]): SessionTask[] {
    const typeMap: Partial<Record<StudentAction["kind"], SessionTask["type"]>> = {
      revise_problem: "revision",
      strengthen_problem: "revision",
      review_concept: "concept",
      resume_problem: "problem",
      solve_new: "problem",
      complete_assignment: "iit",
      resume_roadmap: "roadmap",
    };

    const tasks: SessionTask[] = [];
    for (const action of priorities) {
      const type = typeMap[action.kind];
      if (!type) continue;
      tasks.push({
        id: action.id,
        type,
        title: action.title,
        estimatedMinutes: action.estimatedMinutes,
        href: action.href,
      });
      if (tasks.length >= 5) break;
    }

    if (tasks.length === 0) {
      tasks.push({
        id: "prob-new",
        type: "problem",
        title: "Solve one new problem",
        estimatedMinutes: 25,
        href: "/problems",
      });
    }
    return tasks;
  }
}

function hrefForMemoryAction(action: MemoryIntervention["actions"][number]): string {
  switch (action.kind) {
    case "revise_problem":
      return action.entityId ? `/problems/${action.entityId}` : "/revision";
    case "review_concept":
      return action.entityId ? `/concepts/${action.entityId}` : "/concepts";
    case "review_resource":
      return "/vault";
    case "solve_new":
      return "/problems/new";
    default:
      return "/overview";
  }
}

function hrefForMissedWork(item: MissedWorkItem): string {
  switch (item.sourceType) {
    case "revision":
      return "/revision";
    case "iit_assignment":
      return "/iit-workspace";
    case "reminder":
    default:
      return "/notifications";
  }
}

function dedupe(actions: StudentAction[]): StudentAction[] {
  const seen = new Map<string, StudentAction>();
  for (const action of actions) {
    const existing = seen.get(action.id);
    if (!existing || action.score > existing.score) seen.set(action.id, action);
  }
  return [...seen.values()];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
