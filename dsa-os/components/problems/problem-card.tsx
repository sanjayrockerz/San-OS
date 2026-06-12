"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Code, ChevronDown, RefreshCw, Lightbulb, AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PatternBadge } from "@/components/ui/pattern-badge";
import { getPatternColor } from "@/lib/utils/patterns";
import { cn } from "@/lib/utils";
import type { ProblemMock } from "@/lib/mock-data";

const difficultyVariant = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
} as const;

const statusVariant = {
  Solved: "success",
  Attempted: "warning",
  Review: "default",
} as const;

export function ProblemCard({ problem }: { problem: ProblemMock }) {
  const [open, setOpen] = useState(false);
  const accent = getPatternColor(problem.patterns[0]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="surface-card relative overflow-hidden rounded-2xl"
      style={{ boxShadow: `inset 4px 0 0 ${accent}` }}
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full flex-col gap-3 p-4 pl-5 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{problem.title}</h3>
              {problem.status && <Badge variant={statusVariant[problem.status]}>{problem.status}</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {problem.patterns.map((id) => (
                <PatternBadge key={id} patternId={id} />
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={difficultyVariant[problem.difficulty]}>{problem.difficulty}</Badge>
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span><span className="font-semibold text-foreground">{problem.confidence}%</span> confidence</span>
          {problem.timeTaken && <span className="flex items-center gap-1"><Clock className="size-3" /> {problem.timeTaken}</span>}
          {problem.language && <span className="flex items-center gap-1"><Code className="size-3" /> {problem.language}</span>}
          <span className="flex items-center gap-1"><Calendar className="size-3" /> {problem.lastSolved}</span>
          {problem.lastRevised && <span className="flex items-center gap-1"><RefreshCw className="size-3" /> {problem.lastRevised}</span>}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border px-5 py-4">
              {problem.notes && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Lightbulb className="size-3.5 text-primary" /> My algorithm
                  </p>
                  <p className="rounded-lg bg-background-subtle/50 p-3 font-mono text-xs leading-relaxed text-foreground/90">
                    {problem.notes}
                  </p>
                </div>
              )}
              {problem.mistakes && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <AlertCircle className="size-3.5 text-warning" /> Mistakes
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{problem.mistakes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
