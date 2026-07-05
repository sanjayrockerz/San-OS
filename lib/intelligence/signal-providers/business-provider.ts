import type { Repositories } from "@/lib/repositories";
import type { Signal, SignalProvider } from "../types";

export class BusinessSignalProvider implements SignalProvider {
  readonly id = "business-signals";
  readonly domain = "business" as const;

  constructor(private readonly repos: Repositories) {}

  async collect(userId: string): Promise<Signal[]> {
    const signals: Signal[] = [];
    const now = new Date().toISOString();

    const [invoices, pipelineEntries] = await Promise.all([
      this.repos.invoices.findByUser(userId).catch(() => []),
      this.repos.pipelineEntries.findByUser(userId).catch(() => []),
    ]);

    for (const invoice of invoices) {
      if (invoice.status === "overdue") {
        const overdueDays = invoice.due_date
          ? Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / 86400000)
          : 0;
        signals.push({
          id: `business-overdue-${invoice.id}`,
          domain: "business",
          type: "invoice_overdue",
          title: `Overdue invoice: ${invoice.invoice_number ?? invoice.id}`,
          description: `${overdueDays} days overdue`,
          urgency: Math.min(1, 0.5 + overdueDays * 0.05),
          impact: 0.8,
          confidence: 0.95,
          entityType: "invoice",
          entityId: invoice.id,
          createdAt: now,
          metadata: { amount: invoice.total_amount, overdueDays },
        });
      }
    }

    for (const entry of pipelineEntries.filter((e) => e.status === "active")) {
      signals.push({
        id: `business-pipeline-${entry.id}`,
        domain: "business",
        type: "pipeline_active",
        title: `Pipeline: ${entry.title}`,
        description: `Stage: ${entry.stage ?? "lead"}`,
        urgency: 0.4,
        impact: 0.7,
        confidence: 0.5,
        entityType: "pipeline_entry",
        entityId: entry.id,
        createdAt: now,
        metadata: { stage: entry.stage, value: entry.value },
      });
    }

    return signals;
  }
}
