"use client";

import { Check, SkipForward, Sparkles, RotateCcw } from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PatternBadge } from "@/components/ui/pattern-badge";
import { cn } from "@/lib/utils";
import { getPatternById } from "@/lib/utils/patterns";
import { revisionCard } from "@/lib/mock-data";

export default function RevisionPage() {
  const pattern = getPatternById(revisionCard.patternId);
  const total = 8;
  const current = 1;

  return (
    <PageTransition>
      <Section className="mb-6 text-center">
        <h1 className="text-[28px] font-bold tracking-tight sm:text-[34px]">Revision</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Spaced repetition keeps your weakest patterns sharp.
        </p>
        {/* progress dots */}
        <div className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < current ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{current} of {total} due today</p>
      </Section>

      <Section className="mx-auto w-full max-w-xl">
        <Card className="overflow-hidden shadow-[var(--shadow-lg)]">
          <div className="h-1.5 w-full" style={{ backgroundColor: pattern?.color }} />
          <CardContent className="p-6 pt-6">
            <div className="flex items-center justify-between">
              <PatternBadge patternId={revisionCard.patternId} size="md" withEmoji />
              <Badge variant="warning">{revisionCard.difficulty}</Badge>
            </div>

            <h2 className="mt-5 text-xl font-semibold leading-snug text-balance">
              {revisionCard.title}
            </h2>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background-subtle/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Mastery: <span className="font-medium text-foreground">{revisionCard.mastery}</span>
            </div>

            <Separator className="my-6" />

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Algorithm Preview
              </p>
              <ol className="flex flex-col gap-2.5">
                {revisionCard.algorithm.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] gap-3">
          <Button variant="secondary" size="lg"><SkipForward className="size-4" /> Skip</Button>
          <Button variant="outline" size="lg" className="px-4"><RotateCcw className="size-4" /></Button>
          <Button variant="success" size="lg"><Check className="size-4" /> Mark Done</Button>
        </div>
      </Section>
    </PageTransition>
  );
}
