import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

import { BaseService, isoDate } from "./base.service";
import type {
  CreateExpenseEntryInput,
  CreateIncomeEntryInput,
} from "@/lib/validators/business";

export interface FinanceSnapshot {
  monthRevenue: number;
  monthExpenses: number;
  monthProfit: number;
  outstandingAr: number;
  pipelineValue: number;
  pipelineWeighted: number;
}

export class FinanceService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  recordIncome(
    userId: string,
    input: CreateIncomeEntryInput,
  ): Promise<Tables<"income_entries">> {
    return this.repos.incomeEntries.create({ ...input, user_id: userId });
  }

  recordExpense(
    userId: string,
    input: CreateExpenseEntryInput,
  ): Promise<Tables<"expense_entries">> {
    return this.repos.expenseEntries.create({ ...input, user_id: userId });
  }

  listIncome(userId: string): Promise<Tables<"income_entries">[]> {
    return this.repos.incomeEntries.findByUser(userId);
  }

  listExpenses(userId: string): Promise<Tables<"expense_entries">[]> {
    return this.repos.expenseEntries.findByUser(userId);
  }

  /** Revenue, expenses, AR, and pipeline value for the current calendar month. */
  async snapshot(userId: string): Promise<FinanceSnapshot> {
    const now = new Date();
    const monthStart = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = isoDate(now);

    const [income, expenses, invoices, pipeline] = await Promise.all([
      this.repos.incomeEntries.between(userId, monthStart, monthEnd),
      this.repos.expenseEntries.between(userId, monthStart, monthEnd),
      this.repos.invoices.findByUser(userId),
      this.repos.pipelineEntries.findOpen(userId),
    ]);

    const monthRevenue = income.reduce((sum, i) => sum + i.amount, 0);
    const monthExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const outstandingAr = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + i.total_amount, 0);
    const pipelineValue = pipeline.reduce((sum, p) => sum + (p.value_estimate ?? 0), 0);
    const pipelineWeighted = pipeline.reduce(
      (sum, p) => sum + ((p.value_estimate ?? 0) * p.probability) / 100,
      0,
    );

    return {
      monthRevenue,
      monthExpenses,
      monthProfit: monthRevenue - monthExpenses,
      outstandingAr,
      pipelineValue,
      pipelineWeighted,
    };
  }
}
