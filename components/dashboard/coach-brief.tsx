"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, Sparkles, AlertTriangle, PlayCircle, Gauge } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/charts/progress-ring";
import { cn } from "@/lib/utils";
import type { DailyCoachBrief, FocusStep, RecoveryPlan } from "@/lib/services";
import { CATEGORY_TEXT } from "@/lib/design/category";
import { FocusSession } from "./focus-session";

/**
 * Daily Coach Brief — the first thing visible in Mission Control (now "Coach
 * Overview"). Reshapes StudentCoachService.dailyBrief() into a short,
 * supportive read: what happened yesterday, the single biggest opportunity
 * and risk today, and a guided plan the user can start in one click. Replaces
 * the old "Today's Mission" block, which only showed a raw action list.
 */
export function CoachBrief({ brief, recovery }: { brief: DailyCoachBrief; recovery: RecoveryPlan }) {
  const [sessionOpen, setSessionOpen] = useState(false);

  const steps: FocusStep[] = brief.today.recommendedPlan.map((action, i) => ({
    stepNumber: i + 1,
    action,
  }));

  const { yesterday, today } = brief;
  const hadYesterday = yesterday.completed > 0 || yesterday.missed > 0 || yesterday.learningWins > 0;

  return (
    <Section>
      <div className="surface-card rounded-2xl border-category-mission/25 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className={cn("size-4.5", CATEGORY_TEXT.mission)} />
            <h2 className="text-section">{brief.greeting}</h2>
          </div>
          {today.estimatedMinutes > 0 && <Badge variant="default">~{today.estimatedMinutes} min</Badge>}
        </div>

        {brief.confidence && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border p-2.5">
            <ProgressRing value={Math.round(brief.confidence.averageSuccessRate * 100)} size={36} stroke={4}>
              <Gauge className="size-3.5 text-primary" />
            </ProgressRing>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {Math.round(brief.confidence.averageSuccessRate * 100)}% coach confidence
              </span>
              {brief.confidence.mostEffectiveKind && (
                <>
                  {" "}— {brief.confidence.mostEffectiveKind.label.toLowerCase()} works best for you (
                  {Math.round(brief.confidence.mostEffectiveKind.successRate * 100)}% success)
                </>
              )}
            </p>
          </div>
        )}

        {hadYesterday && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-2.5 text-center">
              <p className="text-lg font-bold tabular text-success">{yesterday.completed}</p>
              <p className="text-[10px] text-muted-foreground">completed yesterday</p>
            </div>
            <div className="rounded-xl border border-border p-2.5 text-center">
              <p className="text-lg font-bold tabular text-danger">{yesterday.missed}</p>
              <p className="text-[10px] text-muted-foreground">missed yesterday</p>
            </div>
            <div className="rounded-xl border border-border p-2.5 text-center">
              <p className="text-lg font-bold tabular text-primary">{yesterday.learningWins}</p>
              <p className="text-[10px] text-muted-foreground">learning wins</p>
            </div>
          </div>
        )}

        <div className="mb-4 space-y-2">
          {today.biggestOpportunity && (
            <div className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/5 p-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed">
                <span className="font-medium">Biggest opportunity: </span>
                {today.insight ?? today.biggestOpportunity.detail}
              </p>
            </div>
          )}
          {today.biggestRisk && (
            <div className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/5 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
              <p className="text-sm leading-relaxed">
                <span className="font-medium">Watch out: </span>
                {today.biggestRisk.reason}
              </p>
            </div>
          )}
          {!today.biggestOpportunity && !today.biggestRisk && (
            <p className="text-sm text-muted-foreground py-2">
              Nothing urgent right now. Good time to get ahead —{" "}
              <Link href="/problems" className="text-primary hover:underline">
                solve a new problem
              </Link>
              .
            </p>
          )}
        </div>

        {recovery.totalMissed > 0 && (
          <p className="mb-3 text-xs text-warning">
            You have {recovery.totalMissed} missed item{recovery.totalMissed === 1 ? "" : "s"} — see the
            Recovery Plan below before starting something new.
          </p>
        )}

        {steps.length > 0 &&
          (sessionOpen ? (
            <FocusSession steps={steps} />
          ) : (
            <Button onClick={() => setSessionOpen(true)}>
              <PlayCircle className="size-4" /> Start Focus Session
            </Button>
          ))}
      </div>
    </Section>
  );
}
