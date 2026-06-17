"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, Lightbulb, TrendingUp } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

import type { OverviewData } from "./overview-client";

type RecommendationItem = OverviewData["recommendations"][0];

const DISMISSED_KEY = "sanos_dismissed_recs";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function getIconForPriority(priority: number) {
  if (priority === 1) return TrendingUp; // Urgent / Streak / Revision
  if (priority === 2) return Lightbulb; // Concepts / Knowledge
  return Sparkles; // General
}

export function RecommendationsPanel({
  items,
}: {
  items: RecommendationItem[];
}) {
  const [activeItems, setActiveItems] = useState<RecommendationItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // On mount, filter out dismissed recommendations that haven't expired
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) {
        const dismissedMap = JSON.parse(stored) as Record<string, number>;
        const now = Date.now();
        // Clean up expired ones
        let updated = false;
        for (const [id, timestamp] of Object.entries(dismissedMap)) {
          if (now - timestamp > THREE_DAYS_MS) {
            delete dismissedMap[id];
            updated = true;
          }
        }
        if (updated) {
          localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedMap));
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveItems(items.filter((item) => !dismissedMap[item.id]));
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveItems(items);
      }
    } catch {
      setActiveItems(items);
    }
    setMounted(true);
  }, [items]);

  if (!mounted || activeItems.length === 0) return null;

  function dismiss(id: string) {
    setActiveItems((prev) => prev.filter((item) => item.id !== id));
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      const dismissedMap = stored ? JSON.parse(stored) : {};
      // eslint-disable-next-line react-hooks/purity
      dismissedMap[id] = Date.now();
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedMap));
    } catch {
      // best effort
    }
  }

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
        <SectionHeading title="Suggested Actions" />
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {activeItems.slice(0, 3).map((item) => {
              const Icon = getIconForPriority(item.priority);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="relative flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.body}
                    </p>
                    {item.href && (
                      <div className="pt-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={item.href}>{item.actionLabel}</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(item.id)}
                    className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Dismiss"
                  >
                    <X className="size-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}
