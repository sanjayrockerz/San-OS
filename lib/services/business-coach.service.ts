import type { Repositories } from "@/lib/repositories";

import { BaseService } from "./base.service";
import { scoreAction } from "./student-action-scoring";
import type { RiskEntry, RiskLevel, StudentAction } from "./student-intelligence-core.service";

export interface BusinessAction extends StudentAction {
  source: "business";
}

/**
 * BusinessCoachService — maps client/invoice/pipeline state onto
 * StudentAction/RiskEntry so business work flows through
 * StudentIntelligenceCoreService's single ranking pipeline, the same way
 * ProjectCoachService surfaces project work. No new prioritization logic:
 * this is a signal provider, not a second intelligence kernel.
 */
export class BusinessCoachService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async actions(userId: string): Promise<BusinessAction[]> {
    const [overdueInvoices, sentInvoices, staleLeads] = await Promise.all([
      safeResolve(this.repos.invoices.findOverdue(userId), []),
      safeResolve(this.repos.invoices.findByStatus(userId, "sent"), []),
      safeResolve(this.repos.pipelineEntries.findOpen(userId), []),
    ]);

    const actions: BusinessAction[] = [];
    const now = Date.now();

    for (const invoice of overdueInvoices.slice(0, 5)) {
      const daysOverdue = invoice.due_date
        ? Math.ceil((now - new Date(invoice.due_date).getTime()) / 86_400_000)
        : 1;
      actions.push(
        this.makeAction({
          kind: "collect_invoice" as StudentAction["kind"],
          title: `Follow up: Invoice ${invoice.invoice_number}`,
          detail: `Overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}.`,
          href: "/invoices",
          entityId: invoice.id,
          estimatedMinutes: 10,
          urgency: Math.min(0.95, 0.65 + daysOverdue * 0.04),
          impact: 0.8,
          momentum: 0.3,
          lastTouchedAt: invoice.updated_at,
        }),
      );
    }

    for (const invoice of sentInvoices.slice(0, 3)) {
      const daysSinceSent = invoice.sent_at
        ? Math.ceil((now - new Date(invoice.sent_at).getTime()) / 86_400_000)
        : 0;
      if (daysSinceSent < 5) continue;
      actions.push(
        this.makeAction({
          kind: "collect_invoice" as StudentAction["kind"],
          title: `Check in on Invoice ${invoice.invoice_number}`,
          detail: `Sent ${daysSinceSent} days ago with no payment yet.`,
          href: "/invoices",
          entityId: invoice.id,
          estimatedMinutes: 10,
          urgency: 0.45,
          impact: 0.6,
          momentum: 0.3,
          lastTouchedAt: invoice.updated_at,
        }),
      );
    }

    const staleDays = 10;
    for (const entry of staleLeads.slice(0, 5)) {
      const daysSinceUpdate = Math.ceil(
        (now - new Date(entry.updated_at).getTime()) / 86_400_000,
      );
      if (daysSinceUpdate < staleDays) continue;
      actions.push(
        this.makeAction({
          kind: "advance_pipeline" as StudentAction["kind"],
          title: `Advance: ${entry.title}`,
          detail: `No movement in ${daysSinceUpdate} days — still in ${entry.stage}.`,
          href: "/pipeline",
          entityId: entry.id,
          estimatedMinutes: 15,
          urgency: Math.min(0.7, 0.3 + daysSinceUpdate * 0.02),
          impact: 0.55,
          momentum: 0.2,
          lastTouchedAt: entry.updated_at,
        }),
      );
    }

    return actions.sort((a, b) => b.score - a.score);
  }

  async risks(userId: string): Promise<RiskEntry[]> {
    const [overdueInvoices, openPipeline] = await Promise.all([
      safeResolve(this.repos.invoices.findOverdue(userId), []),
      safeResolve(this.repos.pipelineEntries.findOpen(userId), []),
    ]);
    const entries: RiskEntry[] = [];
    const now = Date.now();

    for (const invoice of overdueInvoices.slice(0, 5)) {
      const daysOverdue = invoice.due_date
        ? Math.ceil((now - new Date(invoice.due_date).getTime()) / 86_400_000)
        : 1;
      const riskLevel: RiskLevel =
        daysOverdue >= 14 ? "critical" : daysOverdue >= 7 ? "high" : "medium";
      entries.push({
        entityType: "invoice",
        entityId: invoice.id,
        name: `Invoice ${invoice.invoice_number}`,
        riskLevel,
        reason: `Overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}.`,
        recommendedAction: {
          label: "Open invoices",
          href: "/invoices",
          entityId: invoice.id,
        },
      });
    }

    // Stale high-value pipeline entries in proposal/negotiation are a business risk.
    const stalePipelineDays = 21;
    for (const entry of openPipeline.slice(0, 3)) {
      if (entry.stage !== "proposal" && entry.stage !== "negotiation") continue;
      const daysSinceUpdate = Math.ceil(
        (now - new Date(entry.updated_at).getTime()) / 86_400_000,
      );
      if (daysSinceUpdate < stalePipelineDays) continue;
      entries.push({
        entityType: "pipeline_entry",
        entityId: entry.id,
        name: entry.title,
        riskLevel: "medium",
        reason: `${entry.stage} stalled for ${daysSinceUpdate} days — deal may go cold.`,
        recommendedAction: {
          label: "Open pipeline",
          href: "/pipeline",
          entityId: entry.id,
        },
      });
    }

    return entries;
  }

  private makeAction(
    input: Omit<BusinessAction, "id" | "score" | "source">,
  ): BusinessAction {
    return {
      ...input,
      id: `business-${input.kind}-${input.entityId ?? input.title}`,
      source: "business",
      score: scoreAction(input),
    };
  }
}

async function safeResolve<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
