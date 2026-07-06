import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
import { EntityResolutionEngine } from "@/lib/entity-resolution";
import type { CreateClientInput, UpdateClientInput } from "@/lib/validators/business";

export interface ClientWorkspace {
  client: Tables<"clients">;
  projects: Tables<"projects">[];
  invoices: Tables<"invoices">[];
  pipelineEntries: Tables<"pipeline_entries">[];
  quotes: Tables<"project_quotes">[];
  totalRevenue: number;
  outstandingAmount: number;
}

export class ClientService extends BaseService {
  private readonly events: EventService;
  private readonly entityResolver: EntityResolutionEngine;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
    this.entityResolver = new EntityResolutionEngine(repos);
  }

  listForUser(userId: string): Promise<Tables<"clients">[]> {
    return this.repos.clients.findByUser(userId);
  }

  findById(id: string): Promise<Tables<"clients"> | null> {
    return this.repos.clients.findById(id);
  }

  async create(userId: string, input: CreateClientInput): Promise<Tables<"clients">> {
    const client = await this.repos.clients.create({ ...input, user_id: userId });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ClientCreated,
      entityType: "client",
      entityId: client.id,
      payload: { name: client.name },
    });
    return client;
  }

  async update(
    userId: string,
    id: string,
    input: UpdateClientInput,
  ): Promise<Tables<"clients">> {
    const client = await this.repos.clients.update(id, input);
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ClientUpdated,
      entityType: "client",
      entityId: id,
      payload: {},
    });
    return client;
  }

  async archive(userId: string, id: string): Promise<Tables<"clients">> {
    const client = await this.repos.clients.update(id, { status: "inactive" });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.ClientArchived,
      entityType: "client",
      entityId: id,
      payload: {},
    });
    return client;
  }

  async createFromNaturalText(userId: string, text: string): Promise<{ client: Tables<"clients">; resolvedProjectId?: string }> {
    const [entityResult] = await Promise.all([
      this.entityResolver.resolve({ userId, text }),
    ]);

    const resolvedProject = entityResult.matches.find(m => m.type === "project");

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const companyMatch = text.match(/(?:at|from|with|for)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\.|,|\s+project|\s+regarding)/i);

    const nameWords = text.split(/\s+/).slice(0, 3);
    const name = companyMatch?.[1]?.trim() ?? nameWords.join(" ");
    const notes = text.length > 500 ? text.slice(0, 497) + "..." : text;

    const client = await this.repos.clients.create({
      user_id: userId,
      name: name.length > 255 ? name.slice(0, 252) + "..." : name,
      email: emailMatch?.[0] ?? null,
      phone: phoneMatch?.[0] ?? null,
      notes,
      status: "active",
    });

    await this.repos.events.create({
      user_id: userId,
      event_type: "client.from_text",
      entity_type: "client",
      entity_id: client.id,
      payload: {
        source_text: text.slice(0, 500),
        resolved_entities: entityResult.matches.map(m => ({ type: m.type, id: m.id, name: m.name })),
      },
    }).catch(() => {});

    this.events.emit(userId, {
      eventType: EVENT_TYPES.ClientCreated,
      entityType: "client",
      entityId: client.id,
      payload: { name: client.name, fromNaturalText: true },
    });

    return { client, resolvedProjectId: resolvedProject?.id };
  }

  /** Full client workspace: every entity the client touches, plus a revenue rollup. */
  async workspace(clientId: string): Promise<ClientWorkspace | null> {
    const client = await this.repos.clients.findById(clientId);
    if (!client) return null;

    const [projects, invoices, pipelineEntries, quotes] = await Promise.all([
      this.repos.projects.findByClient(clientId),
      this.repos.invoices.findByClient(clientId),
      this.repos.pipelineEntries.findByClient(clientId),
      this.repos.projectQuotes.findByClient(clientId),
    ]);

    const totalRevenue = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.total_amount, 0);

    const outstandingAmount = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + i.total_amount, 0);

    return {
      client,
      projects,
      invoices,
      pipelineEntries,
      quotes,
      totalRevenue,
      outstandingAmount,
    };
  }
}
