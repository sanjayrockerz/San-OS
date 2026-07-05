import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Section } from "@/components/layout/page-transition";
import { cn } from "@/lib/utils";
import type { FinanceSnapshot } from "@/lib/services";

function fmt(n: number): string {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
}

export function FinanceSnapshotWidget({ snapshot }: { snapshot: FinanceSnapshot }) {
  const profitable = snapshot.monthProfit >= 0;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-primary" />
            <p className="text-title">Finance</p>
          </div>
          <Link href="/finance" className="text-xs font-medium text-primary hover:underline">
            Details
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-success/5 p-2.5">
            <p className="text-[10px] text-muted-foreground">Revenue</p>
            <p className="mt-0.5 tabular text-sm font-bold text-success">
              {fmt(snapshot.monthRevenue)}
            </p>
          </div>
          <div className="rounded-lg bg-danger/5 p-2.5">
            <p className="text-[10px] text-muted-foreground">Expenses</p>
            <p className="mt-0.5 tabular text-sm font-bold text-danger">
              {fmt(snapshot.monthExpenses)}
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">Profit</span>
          <div className="flex items-center gap-1">
            {profitable ? (
              <TrendingUp className="size-3.5 text-success" />
            ) : (
              <TrendingDown className="size-3.5 text-danger" />
            )}
            <span className={cn("tabular text-sm font-bold", profitable ? "text-success" : "text-danger")}>
              {fmt(snapshot.monthProfit)}
            </span>
          </div>
        </div>

        {snapshot.outstandingAr > 0 && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            {fmt(snapshot.outstandingAr)} outstanding AR
          </p>
        )}
      </div>
    </Section>
  );
}
