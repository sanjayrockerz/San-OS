"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, TrendingUp, TrendingDown, Pencil, Trash2, Check } from "lucide-react";

import type { Tables } from "@/types/database";
import type { FinanceSnapshot } from "@/lib/services/finance.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart } from "@/components/charts/bar-chart";
import { recordIncome, recordExpense, recordFinanceNote, previewFinanceNote, updateIncome, deleteIncome, updateExpense, deleteExpense } from "@/app/(app)/finance/actions";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    amount,
  );
}

export interface MonthlyTrendPoint {
  label: string;
  key: string;
  revenue: number;
  expenses: number;
}

interface Props {
  snapshot: FinanceSnapshot;
  income: Tables<"income_entries">[];
  expenses: Tables<"expense_entries">[];
  clients: Tables<"clients">[];
  projects: Tables<"projects">[];
  monthlyTrend: MonthlyTrendPoint[];
}

export function FinanceDashboard({ snapshot, income, expenses, clients, projects, monthlyTrend }: Props) {
  const [activeForm, setActiveForm] = useState<"income" | "expense" | null>(null);

  return (
    <div className="space-y-6">
      <FinancePulse snapshot={snapshot} />
      <FinanceNoteForm />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">This Month Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-400">
            {formatCurrency(snapshot.monthRevenue)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">This Month Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-red-400">
            {formatCurrency(snapshot.monthExpenses)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Net Profit</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(snapshot.monthProfit)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Outstanding AR</p>
          <p className="mt-1 text-2xl font-semibold text-amber-400">
            {formatCurrency(snapshot.outstandingAr)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pipeline Value</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(snapshot.pipelineValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Weighted Pipeline</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(snapshot.pipelineWeighted)}</p>
        </Card>
      </div>

      {/* Finance Coach */}
      <FinanceCoach snapshot={snapshot} />

      {/* 6-month trend */}
      <MonthlyTrendChart monthlyTrend={monthlyTrend} />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setActiveForm(activeForm === "income" ? null : "income")}
        >
          {activeForm === "income" ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          Record Income
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setActiveForm(activeForm === "expense" ? null : "expense")}
        >
          {activeForm === "expense" ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          Record Expense
        </Button>
      </div>

      {activeForm === "income" && (
        <IncomeForm clients={clients} projects={projects} onClose={() => setActiveForm(null)} />
      )}
      {activeForm === "expense" && <ExpenseForm onClose={() => setActiveForm(null)} />}

      {/* Recent lists */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Recent Income</h3>
          {income.length === 0 ? (
            <p className="text-sm text-muted-foreground">No income recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {income.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {entry.description ?? entry.category} · {entry.received_at}
                  </span>
                  <span className="flex items-center gap-2"><span className="text-emerald-400">{formatCurrency(entry.amount, entry.currency)}</span><FinanceEntryActions kind="income" entry={entry} /></span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Recent Expenses</h3>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {entry.description ?? entry.category} · {entry.occurred_at}
                  </span>
                  <span className="flex items-center gap-2"><span className="text-red-400">{formatCurrency(entry.amount, entry.currency)}</span><FinanceEntryActions kind="expense" entry={entry} /></span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function FinanceEntryActions({ kind, entry }: { kind: "income" | "expense"; entry: Tables<"income_entries"> | Tables<"expense_entries"> }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleteState, deleteAction, deleting] = useActionState(kind === "income" ? deleteIncome : deleteExpense, null);
  useEffect(() => { if (deleteState?.ok) router.refresh(); }, [deleteState, router]);
  const isIncome = kind === "income";
  const updateAction = async (formData: FormData) => { await (isIncome ? updateIncome(null, formData) : updateExpense(null, formData)); setEditing(false); router.refresh(); };
  if (editing) return <form action={updateAction} className="absolute right-2 z-10 grid w-64 gap-2 rounded-xl border bg-card p-3 shadow-xl"><input type="hidden" name="id" value={entry.id} /><Input name="amount" type="number" min="0.01" step="0.01" defaultValue={entry.amount} required aria-label="Amount" /><Input name="category" defaultValue={entry.category} aria-label="Category" /><Input name="description" defaultValue={entry.description ?? ""} placeholder="Description" aria-label="Description" /><Input name={isIncome ? "received_at" : "occurred_at"} type="date" defaultValue={isIncome ? (entry as Tables<"income_entries">).received_at : (entry as Tables<"expense_entries">).occurred_at} aria-label="Date" /><div className="flex gap-1"><Button type="submit" size="sm"><Check className="mr-1 size-3.5" />Save</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div></form>;
  return <span className="relative flex items-center gap-1"><Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => setEditing(true)} aria-label="Edit entry"><Pencil className="size-3.5" /></Button><form action={deleteAction} onSubmit={(event) => { if (!window.confirm(`Delete this ${kind}? This will update your totals.`)) event.preventDefault(); }}><input type="hidden" name="id" value={entry.id} /><Button type="submit" size="icon" variant="ghost" className="size-7 text-destructive hover:text-destructive" disabled={deleting} aria-label="Delete entry"><Trash2 className="size-3.5" /></Button></form></span>;
}

function FinancePulse({ snapshot }: { snapshot: FinanceSnapshot }) {
  const isHealthy = snapshot.monthProfit >= 0;
  return (
    <section className="mission-surface rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Cash position</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{formatCurrency(snapshot.monthProfit)}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {isHealthy
              ? "This month is profitable. Protect the next collection and keep momentum in the pipeline."
              : "Expenses are currently ahead of income. Prioritize collections and defer non-essential spend."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-[240px]">
          <div className="rounded-2xl bg-background/55 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Outstanding</p>
            <p className="mt-1 text-sm font-semibold">{formatCurrency(snapshot.outstandingAr)}</p>
          </div>
          <div className="rounded-2xl bg-background/55 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">Weighted pipeline</p>
            <p className="mt-1 text-sm font-semibold">{formatCurrency(snapshot.pipelineWeighted)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinanceNoteForm() {
  const [state, action, pending] = useActionState(previewFinanceNote, null);
  const [saveState, saveAction, savePending] = useActionState(recordFinanceNote, null);
  const [raw, setRaw] = useState("");
  const preview = state?.ok && state.mode === "preview" ? state : null;

  return (
    <Card className="p-4 border-border/60 shadow-sm">
      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quick Entry</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Type the transaction the way you remember it. We&apos;ll split income and expenses for you.
        </p>
      </div>
      <form action={action} className="space-y-3">
        <textarea
          name="raw"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="I gave 300 to my friend and got 500 from my dad"
          className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
        {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
        {saveState?.ok && saveState.mode === "saved" && <p className="text-xs text-success">{saveState.message}</p>}
        {saveState && !saveState.ok && <p className="text-xs text-destructive">{saveState.error}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Record from words"}
          </Button>
          <span className="text-xs text-muted-foreground">
            No separate fields needed.
          </span>
        </div>
      </form>
      {preview && (
        <div className="mt-4 space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-semibold">{preview.message}</p>
          <div className="space-y-2">
            {preview.entries.map((entry, index) => (
              <div key={`${entry.description}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-background/60 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{entry.description}</span>
                <span className={entry.kind === "income" ? "shrink-0 text-emerald-400" : "shrink-0 text-red-400"}>{entry.kind === "income" ? "+" : "-"}₹{entry.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          <form action={saveAction} className="flex items-center gap-2">
            <input type="hidden" name="raw" value={raw} />
            <input type="hidden" name="confirm" value="true" />
            <Button type="submit" size="sm" disabled={savePending}>{savePending ? "Saving…" : "Confirm and save"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRaw("")}>Clear</Button>
          </form>
        </div>
      )}
    </Card>
  );
}

function FinanceCoach({ snapshot }: { snapshot: FinanceSnapshot }) {
  const { monthRevenue, monthExpenses, outstandingAr, pipelineWeighted } = snapshot;
  const margin = monthRevenue > 0 ? Math.round(((monthRevenue - monthExpenses) / monthRevenue) * 100) : null;
  const arRatio = monthRevenue > 0 ? Math.round((outstandingAr / monthRevenue) * 100) : null;
  const isHealthy = margin !== null && margin >= 30;

  const insight = (() => {
    if (monthRevenue === 0)
      return "No income this month yet. Record your first payment to start tracking your business health.";
    if (outstandingAr > monthRevenue)
      return `Outstanding invoices (${formatCurrency(outstandingAr)}) exceed this month's revenue — follow up to improve cash flow.`;
    if (margin !== null && margin < 0)
      return `Expenses exceeded revenue this month by ${formatCurrency(monthExpenses - monthRevenue)}. Review your largest expense categories.`;
    if (arRatio !== null && arRatio > 50)
      return `${arRatio}% of this month's revenue is still outstanding. Chase invoices before month end.`;
    if (pipelineWeighted > 0)
      return `${formatCurrency(pipelineWeighted)} in weighted pipeline — close deals to build on this month's ${formatCurrency(monthRevenue)} revenue.`;
    return `Healthy month — ${formatCurrency(monthRevenue)} in revenue${margin !== null ? ` at ${margin}% margin` : ""}.`;
  })();

  return (
    <Card className="p-4 flex items-start gap-3">
      <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${isHealthy ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
        {isHealthy ? (
          <TrendingUp className="size-4 text-emerald-400" />
        ) : (
          <TrendingDown className="size-4 text-amber-400" />
        )}
      </span>
      <div>
        <p className="text-sm font-medium">Finance Coach</p>
        <p className="text-xs text-muted-foreground mt-0.5">{insight}</p>
      </div>
    </Card>
  );
}

function MonthlyTrendChart({ monthlyTrend }: { monthlyTrend: MonthlyTrendPoint[] }) {
  const hasData = monthlyTrend.some((m) => m.revenue > 0 || m.expenses > 0);
  if (!hasData) return null;

  return (
    <Card className="p-5 border-border/60 shadow-sm">
      <h3 className="text-sm font-semibold mb-6 text-foreground">6-Month Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
              tickFormatter={(val) => `₹${val.toLocaleString("en-IN")}`}
              width={65}
            />
            <Tooltip 
              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              itemStyle={{ fontSize: "13px", fontWeight: 500 }}
              formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
              labelStyle={{ color: "hsl(var(--muted-foreground))", fontWeight: 500, marginBottom: "4px", fontSize: "13px" }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              name="Revenue"
              stroke="#34d399" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRev)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: "#34d399" }}
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              name="Expenses"
              stroke="#f87171" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorExp)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: "#f87171" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function IncomeForm({
  clients,
  projects,
  onClose,
}: {
  clients: Tables<"clients">[];
  projects: Tables<"projects">[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(recordIncome, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="p-4 rounded-lg border border-border/60 bg-white/5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="inc-amount">Amount (₹) *</Label>
          <Input id="inc-amount" name="amount" type="number" min="0" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="inc-category">Category</Label>
          <Input id="inc-category" name="category" defaultValue="project_revenue" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs" htmlFor="inc-desc">Description</Label>
          <Input id="inc-desc" name="description" placeholder="e.g. Retainer payment" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="inc-date">Received Date</Label>
          <Input id="inc-date" name="received_at" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="inc-client">Client</Label>
          <select
            id="inc-client"
            name="client_id"
            defaultValue=""
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {projects.length > 0 && (
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs" htmlFor="inc-project">Project</Label>
            <select
              id="inc-project"
              name="project_id"
              defaultValue=""
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Record Income"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

function ExpenseForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(recordExpense, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="p-4 rounded-lg border border-border/60 bg-white/5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="exp-amount">Amount (₹) *</Label>
          <Input id="exp-amount" name="amount" type="number" min="0" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="exp-category">Category</Label>
          <Input id="exp-category" name="category" defaultValue="other" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs" htmlFor="exp-desc">Description</Label>
          <Input id="exp-desc" name="description" placeholder="e.g. Software subscription" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="exp-date">Date</Label>
          <Input id="exp-date" name="occurred_at" type="date" />
        </div>
      </div>
      {state && !state.ok && <p className="text-xs text-destructive">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Record Expense"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}
