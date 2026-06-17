"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  RefreshCw,
  Sparkles,
  Check,
  Circle,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Dumbbell,
  Target,
} from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

import type { OverviewData } from "./overview-client";

type DailyPlanItem = OverviewData["dailyPlan"][0];

const TYPE_META: Record<
  DailyPlanItem["type"],
  { icon: React.ElementType; tint: string }
> = {
  revision: { icon: RefreshCw, tint: "#60a5fa" }, // blue-400
  concept: { icon: Sparkles, tint: "#34d399" }, // emerald-400
  problem: { icon: Dumbbell, tint: "#fbbf24" }, // amber-400
  iit: { icon: GraduationCap, tint: "#a78bfa" }, // violet-400
  roadmap: { icon: Target, tint: "#f472b6" }, // pink-400
};

export function DailySessionPanel({
  items,
}: {
  items: DailyPlanItem[];
}) {
  const [list, setList] = useState(items);

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5 border border-primary/10">
        <SectionHeading
          title="Today's Session Plan"
          action={
            list.length > 0 ? (
              <span className="text-xs font-medium text-muted-foreground bg-accent px-2 py-1 rounded-md">
                {list.length} step{list.length === 1 ? "" : "s"}
              </span>
            ) : undefined
          }
        />
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Check className="size-6 text-success/70" />
            <p className="mt-2 text-sm font-medium">Session Complete!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You&apos;ve cleared your generated daily plan.
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            <AnimatePresence initial={false}>
              {list.map((item, i) => (
                <SessionTaskRow
                  key={item.id}
                  index={i + 1}
                  item={item}
                  onComplete={(id) => {
                    // Optimistic removal
                    setList((prev) => prev.filter((t) => t.id !== id));
                  }}
                />
              ))}
            </AnimatePresence>
          </ol>
        )}
      </div>
    </Section>
  );
}

function SessionTaskRow({
  index,
  item,
  onComplete,
}: {
  index: number;
  item: DailyPlanItem;
  onComplete: (id: string) => void;
}) {
  const meta = TYPE_META[item.type] || { icon: BookOpen, tint: "#94a3b8" };
  const Icon = meta.icon;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={item.href}
        className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent"
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            onComplete(item.id);
          }}
          aria-label="Mark complete"
          className="shrink-0 text-muted-foreground transition-colors hover:text-success"
        >
          <span className="relative block">
            <Circle className="size-5 group-hover:hidden" />
            <Check className="hidden size-5 text-success group-hover:block" />
          </span>
        </button>
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
          style={{ backgroundColor: `${meta.tint}22`, color: meta.tint }}
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Est. {item.estimatedMinutes} min
          </p>
        </div>
        <span className="hidden shrink-0 items-center sm:flex">
          <Icon
            className="size-4 opacity-50 transition-opacity group-hover:opacity-100"
            style={{ color: meta.tint }}
          />
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </motion.li>
  );
}
