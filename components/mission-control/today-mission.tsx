import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Clock3, Sparkles } from "lucide-react";
import type { DashboardData } from "./dashboard-data-fetcher";

function metric(data: DashboardData, id: string) {
  return data.kpis[id];
}

export function TodayMission({ data }: { data: DashboardData }) {
  const focus = metric(data, "focus");
  const readiness = metric(data, "readiness");
  const current = data.planner.currentTitle;

  return (
    <section className="mb-6 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="mission-surface rounded-3xl p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="eyebrow">Today&apos;s mission</p>
          <Link href="/execution" className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
            Open plan <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="space-y-2">
          <p className="text-xl font-semibold tracking-tight sm:text-2xl">
            {data.topPriorityTitle ?? "Choose one meaningful win for today."}
          </p>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            {data.coachInsight ?? "Start with the work that makes the rest of the day easier."}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" /> {data.priorityCount} priorities in focus
          </span>
          {focus && <span className="rounded-full bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">{focus.value} deep work</span>}
          {readiness && <span className="rounded-full bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">{readiness.value} ready</span>}
        </div>
      </div>

      <div className="surface-card rounded-3xl p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="eyebrow">Now</p>
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><Clock3 className="size-3" /> Live plan</span>
        </div>
        {current ? (
          <>
            <p className="text-base font-semibold leading-snug">{current}</p>
            <p className="mt-1 text-sm text-muted-foreground">{data.planner.currentWindow ?? "In progress"}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400" style={{ width: `${Math.max(data.planner.completionRate, 12)}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{data.planner.completionRate}% of today complete</p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold">Your next calm step</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{data.planner.nextTitle ?? "Plan a focused first block with your AI coach."}</p>
            <Link href="/execution" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20">
              Design my day <ArrowRight className="size-3.5" />
            </Link>
          </>
        )}
      </div>

      <div className="surface-card rounded-3xl p-4 sm:p-5 lg:col-span-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="eyebrow">Priority stack</p>
          <span className="text-xs text-muted-foreground">{data.planner.totalBlocks} planned blocks</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[data.topPriorityTitle, data.planner.nextTitle, "Protect a recovery window"].map((title, index) => (
            <div key={title ?? index} className="flex min-w-0 items-center gap-3 rounded-2xl bg-muted/60 px-3 py-3">
              {index === 0 ? <CheckCircle2 className="size-4 shrink-0 text-primary" /> : <Circle className="size-4 shrink-0 text-muted-foreground" />}
              <span className="min-w-0 truncate text-sm font-medium">{title ?? "Open priority"}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
