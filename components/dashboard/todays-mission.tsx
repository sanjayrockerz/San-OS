"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, PlayCircle, MoreHorizontal, Plus, ChevronsRight } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { DailyCoachBrief, FocusStep, StudentAction } from "@/lib/services";
import { CATEGORY_TEXT, CATEGORY_TINT } from "@/lib/design/category";
import { ACTION_LABEL_BY_KIND, STUDENT_ACTION_SOURCE_LABEL, scoreToRiskLevel } from "@/lib/design/status";
import { FocusSession } from "./focus-session";

const IMPACT_DOT: Record<ReturnType<typeof scoreToRiskLevel>, string> = {
  low: "bg-muted-foreground",
  medium: "bg-warning",
  high: "bg-warning",
  critical: "bg-danger",
};

const IMPACT_LABEL: Record<ReturnType<typeof scoreToRiskLevel>, string> = {
  low: "Low Impact",
  medium: "Medium Impact",
  high: "High Impact",
  critical: "Urgent",
};

/**
 * Today's Focus — the one dominant card on Mission Control. A numbered list
 * of the day's top priorities with one action per row, plus a single
 * primary CTA ("Start Focus Session") that walks through them in order.
 * Coach commentary (opportunity/risk/confidence) and recovery work now live
 * in InsightsPanel / the "Show more" section instead of cluttering this card.
 */
export function TodaysMission({
  brief,
  priorities,
  onAddPriority,
}: {
  brief: DailyCoachBrief;
  priorities: StudentAction[];
  onAddPriority: () => void;
}) {
  const [sessionOpen, setSessionOpen] = useState(false);
  const top = priorities.slice(0, 3);

  const steps: FocusStep[] = brief.today.recommendedPlan.map((action, i) => ({
    stepNumber: i + 1,
    action,
  }));

  return (
    <Section className="mb-5">
      <div className="surface-card rounded-2xl border-category-mission/25 bg-gradient-to-br from-category-mission/[0.06] via-card to-card p-6 shadow-md sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className={cn("mt-0.5 size-5", CATEGORY_TEXT.mission)} />
            <div>
              <h2 className="text-section">Today&apos;s Focus</h2>
              <p className="text-xs text-muted-foreground">
                {top.length} priorit{top.length === 1 ? "y" : "ies"} • Finish what matters
              </p>
            </div>
          </div>
          {steps.length > 0 && !sessionOpen && (
            <div className="flex items-center gap-1">
              <Button size="lg" onClick={() => setSessionOpen(true)}>
                <PlayCircle className="size-4" /> Start Focus Session
              </Button>
              <Link
                href="/problems"
                className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Browse all problems"
              >
                <ChevronsRight className="size-4" />
              </Link>
            </div>
          )}
        </div>

        {sessionOpen ? (
          <FocusSession steps={steps} />
        ) : top.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nothing queued right now"
            description="Your priority list is clear."
            benefit="Good time to get ahead before something becomes urgent."
            action={{ label: "Solve a new problem", href: "/problems" }}
            className="border-none bg-transparent py-6"
          />
        ) : (
          <div className="space-y-3">
            {top.map((action, i) => {
              const level = scoreToRiskLevel(action.score);
              const ctaLabel = ACTION_LABEL_BY_KIND[action.kind] ?? "Open";
              const sourceLabel = STUDENT_ACTION_SOURCE_LABEL[action.source];
              return (
                <div
                  key={action.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      CATEGORY_TINT.mission,
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{action.title}</p>
                      <Badge variant="secondary" className="hidden sm:inline-flex">{sourceLabel}</Badge>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      ~{action.estimatedMinutes} min
                      <span className={cn("inline-block size-1.5 rounded-full", IMPACT_DOT[level])} />
                      <span className={level === "critical" ? "font-medium text-danger" : undefined}>
                        {IMPACT_LABEL[level]}
                      </span>
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={action.href}>{ctaLabel}</Link>
                  </Button>
                  <button
                    type="button"
                    title="More options"
                    className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!sessionOpen && (
          <button
            type="button"
            onClick={onAddPriority}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-4" /> Add new priority
          </button>
        )}
      </div>
    </Section>
  );
}
