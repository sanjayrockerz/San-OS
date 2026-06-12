"use client";

import { Check, Circle, ArrowRight } from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/charts/progress-ring";
import { cn } from "@/lib/utils";
import { roadmaps } from "@/lib/mock-data";

export default function RoadmapsPage() {
  return (
    <PageTransition>
      <PageHeader
        title="Roadmaps"
        description="Structured paths from fundamentals to interview-ready. Track every stage."
      />

      <Section className="grid gap-4 lg:grid-cols-2">
        {roadmaps.map((r) => (
          <div key={r.id} className="surface-card flex flex-col rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <ProgressRing value={r.progress} size={84} stroke={8} color={r.color}>
                <span className="text-base font-bold tabular">{r.progress}%</span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold tracking-tight">{r.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{r.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{r.done}</span> / {r.total} problems
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              {r.stages.map((s) => (
                <div
                  key={s.name}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                    s.done ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.done ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-success text-success-foreground">
                      <Check className="size-3" />
                    </span>
                  ) : (
                    <Circle className="size-5 text-border-strong" />
                  )}
                  <span className={cn(s.done && "line-through decoration-muted-foreground/40")}>{s.name}</span>
                </div>
              ))}
            </div>

            <Button variant="secondary" className="mt-5 w-full">
              Continue <ArrowRight className="size-4" />
            </Button>
          </div>
        ))}
      </Section>
    </PageTransition>
  );
}
