"use client";

import { useActionState, useState } from "react";
import { Target, Plus, Check } from "lucide-react";
import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { createGoal, updateGoalProgress } from "./actions";
import type { GoalSummary } from "@/lib/services";
import type { Tables } from "@/types/database";
import { cn } from "@/lib/utils";

type UserGoal = Tables<"user_goals">;

const HORIZON_LABELS: Record<string, string> = {
  today: "Today", week: "This Week", month: "This Month",
  quarter: "This Quarter", year: "This Year", life: "Life Goals",
};

const DOMAIN_COLOR: Record<string, string> = {
  learning: "bg-primary/10 text-primary",
  academic: "bg-blue-500/10 text-blue-500",
  project: "bg-amber-500/10 text-amber-500",
  business: "bg-emerald-500/10 text-emerald-500",
  health: "bg-teal-500/10 text-teal-500",
  personal: "bg-muted text-muted-foreground",
  finance: "bg-red-500/10 text-red-500",
};

function GoalCard({ goal }: { goal: UserGoal }) {
  const [, formAction, pending] = useActionState(updateGoalProgress, null);
  const [localProgress, setLocalProgress] = useState(goal.progress);

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{goal.title}</p>
          {goal.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{goal.description}</p>
          )}
        </div>
        <Badge variant="secondary" className={cn("shrink-0 text-[10px]", DOMAIN_COLOR[goal.domain] ?? "")}>
          {goal.domain}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={localProgress} className="h-1.5 flex-1" />
        <span className="w-8 text-right text-xs font-bold tabular">{localProgress}%</span>
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="goalId" value={goal.id} />
        <input
          name="progress"
          type="range"
          min={0}
          max={100}
          value={localProgress}
          onChange={(e) => setLocalProgress(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <button
          type="submit"
          disabled={pending || localProgress === goal.progress}
          className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
        >
          <Check className="size-3" />
        </button>
      </form>
      {goal.target_date && (
        <p className="text-[10px] text-muted-foreground">
          Due {new Date(goal.target_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
        </p>
      )}
    </div>
  );
}

function AddGoalForm({ onDone }: { onDone: () => void }) {
  const [result, formAction, pending] = useActionState(createGoal, null);

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-xl border border-border p-4">
      <input
        name="title"
        placeholder="Goal title"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
        required
      />
      <textarea
        name="description"
        placeholder="Why does this matter? (optional)"
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
        rows={2}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="horizon"
          required
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary/50 focus:outline-none"
        >
          <option value="">Horizon…</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="life">Life</option>
        </select>
        <select
          name="domain"
          defaultValue="personal"
          className="rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary/50 focus:outline-none"
        >
          <option value="learning">Learning</option>
          <option value="academic">Academic</option>
          <option value="project">Project</option>
          <option value="business">Business</option>
          <option value="health">Health</option>
          <option value="personal">Personal</option>
          <option value="finance">Finance</option>
        </select>
      </div>
      <input
        name="targetDate"
        type="date"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground">
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add Goal"}
        </button>
      </div>
      {result && !result.ok && <p className="text-xs text-destructive">{result.error}</p>}
    </form>
  );
}

function HorizonSection({ summary }: { summary: GoalSummary }) {
  const [adding, setAdding] = useState(false);

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-section">{HORIZON_LABELS[summary.horizon] ?? summary.horizon}</h2>
            <span className="text-xs text-muted-foreground">
              {summary.completionRate}% complete
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-primary"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {adding && <AddGoalForm onDone={() => setAdding(false)} />}

        <div className="mt-3 space-y-2">
          {summary.goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>
    </Section>
  );
}

export function GoalsPageClient({ summaries }: { summaries: GoalSummary[] }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <PageTransition>
      <PageHeader
        title="Goal Engine"
        description="Goals at every horizon — today to life."
        actions={
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <Plus className="size-4" /> New Goal
          </button>
        }
      />

      {showAdd && (
        <Section>
          <div className="surface-card rounded-2xl p-5">
            <SectionHeading title="New Goal" />
            <AddGoalForm onDone={() => setShowAdd(false)} />
          </div>
        </Section>
      )}

      {summaries.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set goals at any horizon — from today to your life goals."
          benefit="Goals give every task a bigger purpose."
          action={{ label: "Add your first goal", onClick: () => setShowAdd(true) }}
        />
      ) : (
        <div className="space-y-5">
          {summaries.map((summary) => (
            <HorizonSection key={summary.horizon} summary={summary} />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
