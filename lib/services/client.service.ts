import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
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

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
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
