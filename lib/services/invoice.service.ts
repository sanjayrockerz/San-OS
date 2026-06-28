import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService } from "./base.service";
import { EVENT_TYPES, EventService } from "./event.service";
import type { CreateInvoiceInput, UpdateInvoiceInput } from "@/lib/validators/business";

export class InvoiceService extends BaseService {
  private readonly events: EventService;

  constructor(repos: Repositories) {
    super(repos);
    this.events = new EventService(repos);
  }

  listForUser(userId: string): Promise<Tables<"invoices">[]> {
    return this.repos.invoices.findByUser(userId);
  }

  listByClient(clientId: string): Promise<Tables<"invoices">[]> {
    return this.repos.invoices.findByClient(clientId);
  }

  findById(id: string): Promise<Tables<"invoices"> | null> {
    return this.repos.invoices.findById(id);
  }

  async create(userId: string, input: CreateInvoiceInput): Promise<Tables<"invoices">> {
    const invoice = await this.repos.invoices.create({ ...input, user_id: userId });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.InvoiceCreated,
      entityType: "invoice",
      entityId: invoice.id,
      payload: { invoiceNumber: invoice.invoice_number, amount: invoice.total_amount },
    });
    return invoice;
  }

  async update(
    userId: string,
    id: string,
    input: UpdateInvoiceInput,
  ): Promise<Tables<"invoices">> {
    return this.repos.invoices.update(id, input);
  }

  async send(userId: string, id: string): Promise<Tables<"invoices">> {
    const invoice = await this.repos.invoices.update(id, {
      status: "sent",
      sent_at: new Date().toISOString(),
    });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.InvoiceSent,
      entityType: "invoice",
      entityId: id,
      payload: { invoiceNumber: invoice.invoice_number },
    });
    return invoice;
  }

  /** Marks an invoice paid and records the matching income entry in one step. */
  async markPaid(userId: string, id: string): Promise<Tables<"invoices">> {
    const invoice = await this.repos.invoices.update(id, {
      status: "paid",
      paid_at: new Date().toISOString(),
    });
    await this.repos.incomeEntries.create({
      user_id: userId,
      client_id: invoice.client_id,
      project_id: invoice.project_id,
      invoice_id: invoice.id,
      amount: invoice.total_amount,
      currency: invoice.currency,
      category: "project_revenue",
      description: `Invoice ${invoice.invoice_number}`,
    });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.InvoicePaid,
      entityType: "invoice",
      entityId: id,
      payload: { invoiceNumber: invoice.invoice_number, amount: invoice.total_amount },
    });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.RevenueRecorded,
      entityType: "invoice",
      entityId: id,
      payload: { amount: invoice.total_amount },
    });
    return invoice;
  }

  async cancel(userId: string, id: string): Promise<Tables<"invoices">> {
    const invoice = await this.repos.invoices.update(id, { status: "cancelled" });
    this.events.emit(userId, {
      eventType: EVENT_TYPES.InvoiceCancelled,
      entityType: "invoice",
      entityId: id,
      payload: {},
    });
    return invoice;
  }

  /** Sent invoices past their due date that haven't been flagged overdue yet. */
  async syncOverdue(userId: string): Promise<Tables<"invoices">[]> {
    const overdue = await this.repos.invoices.findOverdue(userId);
    const updated: Tables<"invoices">[] = [];
    for (const invoice of overdue) {
      if (invoice.status === "overdue") {
        updated.push(invoice);
        continue;
      }
      const result = await this.repos.invoices.update(invoice.id, { status: "overdue" });
      this.events.emit(userId, {
        eventType: EVENT_TYPES.InvoiceOverdue,
        entityType: "invoice",
        entityId: invoice.id,
        payload: { invoiceNumber: invoice.invoice_number },
      });
      updated.push(result);
    }
    return updated;
  }
}
