import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { FinanceDashboard, type MonthlyTrendPoint } from "@/components/business-os/finance-dashboard";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function monthKey(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildTrend(
  income: { amount: number; received_at: string | null }[],
  expenses: { amount: number; occurred_at: string | null }[],
): MonthlyTrendPoint[] {
  const now = new Date();
  const months: MonthlyTrendPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    months.push({ label, key, revenue: 0, expenses: 0 });
  }

  for (const e of income) {
    const key = monthKey(e.received_at);
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.revenue += e.amount;
  }

  for (const e of expenses) {
    const key = monthKey(e.occurred_at);
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.expenses += e.amount;
  }

  return months;
}

export default async function FinancePage() {
  const { user, services } = await requireContext("/finance");

  const [snapshot, income, expenses, clients, projects] = await Promise.all([
    safe(services.finance.snapshot(user.id), {
      monthRevenue: 0,
      monthExpenses: 0,
      monthProfit: 0,
      outstandingAr: 0,
      pipelineValue: 0,
      pipelineWeighted: 0,
    }),
    safe(services.finance.listIncome(user.id), []),
    safe(services.finance.listExpenses(user.id), []),
    safe(services.client.listForUser(user.id), []),
    safe(services.project.listForUser(user.id), []),
  ]);

  const monthlyTrend = buildTrend(income, expenses);

  return (
    <PageTransition>
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <PageHeader title="Finance" description="Revenue, expenses, and cash flow at a glance" />
        <FinanceDashboard
          snapshot={snapshot}
          income={income}
          expenses={expenses}
          clients={clients}
          projects={projects}
          monthlyTrend={monthlyTrend}
        />
      </div>
    </PageTransition>
  );
}
