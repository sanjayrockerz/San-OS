"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  X,
  SkipForward,
  Sparkles,
  Clock,
  Flame,
  Target,
  CalendarClock,
  Loader2,
  ExternalLink,
  PartyPopper,
  Lightbulb,
  Bug,
} from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  recordRevision,
  snoozeRevision,
} from "@/app/(app)/revision/actions";
import type { RevisionCard, RevisionWorkspace } from "@/lib/services";

const DIFFICULTY_VARIANT = {
  easy: "success",
  medium: "warning",
  hard: "danger",
} as const;

const URGENCY_META = {
  high: { label: "Overdue", className: "bg-danger/15 text-danger" },
  medium: { label: "Due", className: "bg-warning/15 text-warning" },
  low: { label: "Scheduled", className: "bg-muted text-muted-foreground" },
} as const;

function daysLabel(days: number | null): string {
  if (days == null) return "Never reviewed";
  if (days <= 0) return "Reviewed today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function RevisionClient({ workspace }: { workspace: RevisionWorkspace }) {
  const { hero } = workspace;
  const [cards, setCards] = useState(workspace.cards);
  const [active, setActive] = useState<RevisionCard | null>(null);

  const total = workspace.cards.length;
  const done = total - cards.length;

  const resolve = (problemId: string) => {
    setCards((prev) => prev.filter((c) => c.problemId !== problemId));
    setActive(null);
  };

  return (
    <PageTransition>
      {/* Hero */}
      <Section className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight sm:text-[34px]">
          Today&apos;s Revision Session
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Spaced repetition keeps your weakest patterns sharp. Close these out
          before adding new problems.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <HeroStat
            icon={Target}
            label="Due Today"
            value={`${hero.dueToday}`}
            tint="#60a5fa"
          />
          <HeroStat
            icon={Sparkles}
            label="Weakest Topic"
            value={hero.weakestTopic ?? "—"}
            tint="#fb923c"
          />
          <HeroStat
            icon={Clock}
            label="Estimated Time"
            value={hero.estimatedMinutes > 0 ? `${hero.estimatedMinutes} min` : "—"}
            tint="#34d399"
          />
          <HeroStat
            icon={Flame}
            label="Current Streak"
            value={`${hero.streak} day${hero.streak === 1 ? "" : "s"}`}
            tint="#f87171"
          />
        </div>

        {total > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Session progress</span>
              <span>
                {done} of {total} done
              </span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i < done ? "bg-success" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Due Today */}
      <Section>
        {cards.length === 0 ? (
          <EmptyState
            icon={PartyPopper}
            title={total === 0 ? "Nothing due today" : "Session complete!"}
            description={
              total === 0
                ? "You're all caught up. Solve a new problem to schedule its first revision."
                : "You've cleared every problem due today. Great work — come back tomorrow."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <AnimatePresence initial={false}>
              {cards.map((card) => (
                <DueCard
                  key={card.problemId}
                  card={card}
                  onStart={() => setActive(card)}
                  onResolved={resolve}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </Section>

      <AnimatePresence>
        {active && (
          <RevisionFlow
            card={active}
            onClose={() => setActive(null)}
            onResolved={resolve}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <span
        className="flex size-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${tint}22`, color: tint }}
      >
        <Icon className="size-4" />
      </span>
      <p className="mt-3 truncate text-lg font-bold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DueCard({
  card,
  onStart,
  onResolved,
}: {
  card: RevisionCard;
  onStart: () => void;
  onResolved: (problemId: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const urgency = URGENCY_META[card.urgency];

  function snooze() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("problemId", card.problemId);
      const res = await snoozeRevision(null, fd);
      if (res.ok) onResolved(card.problemId);
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="flex h-full flex-col">
        <CardContent className="flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {card.pattern && <Badge variant="default">{card.pattern.name}</Badge>}
              {card.topic && <Badge variant="secondary">{card.topic.name}</Badge>}
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                urgency.className,
              )}
            >
              {urgency.label}
            </span>
          </div>

          <h3 className="mt-3 text-base font-semibold leading-snug">
            {card.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {card.difficulty && (
              <Badge variant={DIFFICULTY_VARIANT[card.difficulty]}>
                {card.difficulty}
              </Badge>
            )}
            {card.confidence != null && (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3" /> Confidence {card.confidence}/5
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3" /> {daysLabel(card.daysSinceReview)}
            </span>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            <Button size="sm" onClick={onStart} className="flex-1">
              <Check className="size-4" /> Start Revision
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/problems/${card.problemId}`}>
                <ExternalLink className="size-4" /> Open
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={snooze}
              disabled={pending}
              aria-label="Snooze one day"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SkipForward className="size-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RevisionFlow({
  card,
  onClose,
  onResolved,
}: {
  card: RevisionCard;
  onClose: () => void;
  onResolved: (problemId: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function record(success: boolean) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("problemId", card.problemId);
      fd.set("success", String(success));
      const res = await recordRevision(null, fd);
      if (res.ok) onResolved(card.problemId);
      else setError(res.error);
    });
  }

  function snooze() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("problemId", card.problemId);
      const res = await snoozeRevision(null, fd);
      if (res.ok) onResolved(card.problemId);
      else setError(res.error);
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 py-[8vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {card.pattern && <Badge variant="default">{card.pattern.name}</Badge>}
              {card.difficulty && (
                <Badge variant={DIFFICULTY_VARIANT[card.difficulty]}>
                  {card.difficulty}
                </Badge>
              )}
            </div>
            <h2 className="mt-2 text-base font-semibold leading-snug">
              {card.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto px-5 py-4">
          <FlowBlock
            icon={Lightbulb}
            title="Your algorithm"
            body={card.algorithm}
            empty="No saved algorithm yet — recall it from memory first, then check the problem."
          />
          {card.lastMistake && (
            <FlowBlock icon={Bug} title="Last mistake" body={card.lastMistake} />
          )}
          {card.takeaway && (
            <FlowBlock icon={Sparkles} title="Takeaway" body={card.takeaway} />
          )}

          <Separator />
          <Link
            href={`/problems/${card.problemId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" /> Open full problem workspace
          </Link>
        </div>

        {error && (
          <p className="px-5 pb-1 text-xs text-danger">{error}</p>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 border-t border-border p-4">
          <Button
            variant="danger"
            onClick={() => record(false)}
            disabled={pending}
          >
            <X className="size-4" /> Failed
          </Button>
          <Button
            variant="outline"
            onClick={snooze}
            disabled={pending}
            className="px-3"
          >
            <SkipForward className="size-4" /> Snooze
          </Button>
          <Button
            variant="success"
            onClick={() => record(true)}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Got it
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FlowBlock({
  icon: Icon,
  title,
  body,
  empty,
}: {
  icon: typeof Lightbulb;
  title: string;
  body: string | null;
  empty?: string;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5 text-primary" /> {title}
      </p>
      <p
        className={cn(
          "text-sm leading-relaxed",
          body ? "text-foreground" : "italic text-muted-foreground",
        )}
      >
        {body ?? empty}
      </p>
    </div>
  );
}
