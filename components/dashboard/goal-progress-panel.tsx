import Link from "next/link";
import { Target, ArrowRight, TrendingUp } from "lucide-react";
import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { GoalSummary } from "@/lib/services";

const DOMAIN_COLOR: Record<string, string> = {
  learning: "bg-category-mission",
  academic: "bg-category-academic",
  project: "bg-category-warning",
  business: "bg-category-consistency",
  health: "bg-category-knowledge",
  personal: "bg-category-memory",
  finance: "bg-category-critical",
};

const HORIZON_SHORT: Record<string, string> = {
  today: "Today",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
  life: "Life",
};

export function GoalProgressPanel({ summaries }: { summaries: GoalSummary[] }) {
  const activeGoals = summaries.flatMap((s) => s.goals).slice(0, 6);

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading
          title="Goal Engine"
          action={
            <Link href="/goals" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Manage <ArrowRight className="size-3" />
            </Link>
          }
        />

        {activeGoals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No active goals"
            description="Set goals at any horizon — today to life."
            benefit="Goals give every task a reason."
            action={{ label: "Set a goal", href: "/goals" }}
            className="border-none bg-transparent py-6"
          />
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        DOMAIN_COLOR[goal.domain] ?? "bg-muted-foreground",
                      )}
                    />
                    <p className="truncate text-sm font-medium">{goal.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {HORIZON_SHORT[goal.horizon]}
                    </span>
                    <span className="tabular text-xs font-bold">{goal.progress}%</span>
                  </div>
                </div>
                <Progress value={goal.progress} className="h-1" />
              </div>
            ))}

            {summaries.length > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <TrendingUp className="size-3.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(summaries.reduce((s, sum) => s + sum.completionRate, 0) / Math.max(1, summaries.length))}% avg completion across {summaries.length} horizon{summaries.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
