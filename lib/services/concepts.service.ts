import type { Repositories } from "@/lib/repositories";
import type { Tables, TablesInsert } from "@/types/database";

import { ActivityService } from "./activity.service";
import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";

type Concept = Tables<"concept_notes">;

/** A concept note together with its attached resources and linked problem ids. */
export interface ConceptDetail {
  concept: Concept;
  resources: Tables<"concept_resources">[];
  linkedProblemIds: string[];
}

/**
 * Knowledge & Concept Vault service. Wraps concept CRUD with activity logging
 * and manages a concept's resources and problem links.
 */
export class ConceptService extends BaseService {
  private readonly activity: ActivityService;
  private readonly events: EventService;

  constructor(repos: Repositories) {
    super(repos);
    this.activity = new ActivityService(repos);
    this.events = new EventService(repos);
  }

  list(userId: string): Promise<Concept[]> {
    return this.repos.concepts.findByUser(userId);
  }

  async detail(conceptId: string): Promise<ConceptDetail | null> {
    const concept = await this.repos.concepts.findById(conceptId);
    if (!concept) return null;
    const resources = await this.repos.conceptResources.findByConcept(conceptId);
    const links = await this.repos.conceptProblems.findByConcept(conceptId);
    return {
      concept,
      resources,
      linkedProblemIds: links.map((l) => l.problem_id),
    };
  }

  async create(
    userId: string,
    values: Omit<TablesInsert<"concept_notes">, "user_id">,
  ): Promise<Concept> {
    const concept = await this.repos.concepts.create({
      ...values,
      user_id: userId,
    });
    await this.activity.log(userId, {
      type: "concept_added",
      title: "Added a concept note",
      entityType: "concept",
      entityId: concept.id,
      metadata: { title: concept.title },
    });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.ConceptCreated,
      entityType: "concept",
      entityId: concept.id,
      payload: { title: concept.title },
    });
    return concept;
  }

  /** Records a revision of a concept: updates status/confidence and logs it. */
  async revise(
    userId: string,
    conceptId: string,
    status: Concept["status"],
    confidence?: number | null,
  ): Promise<Concept> {
    const concept = await this.repos.concepts.update(conceptId, {
      status,
      confidence: confidence ?? null,
    });
    await this.activity.log(userId, {
      type: "concept_revised",
      title: "Revised a concept",
      entityType: "concept",
      entityId: conceptId,
      metadata: { status },
    });
    await this.activity.bumpDailyCounters(userId, { revisions_done: 1 });
    await this.events.emit(userId, {
      eventType: EVENT_TYPES.ConceptRevised,
      entityType: "concept",
      entityId: conceptId,
      payload: { title: concept.title, status },
    });
    return concept;
  }

  addResource(
    userId: string,
    values: Omit<TablesInsert<"concept_resources">, "user_id">,
  ): Promise<Tables<"concept_resources">> {
    return this.repos.conceptResources.create({ ...values, user_id: userId });
  }

  /** Links a concept to a problem (idempotent via the unique constraint). */
  linkProblem(
    userId: string,
    conceptId: string,
    problemId: string,
  ): Promise<Tables<"concept_problems">> {
    return this.repos.conceptProblems.create({
      user_id: userId,
      concept_id: conceptId,
      problem_id: problemId,
    });
  }
}
