"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { CATEGORY_TEXT } from "@/lib/design/category";
import { DAILY_PLAN_TYPE_CATEGORY, type DailyPlanType } from "@/lib/design/status";
import type { OverviewData } from "./overview-client";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/**
 * Combined calendar + schedule card for the context rail. The week strip is
 * decorative navigation (no per-day event data exists yet), so only "today"
 * gets a real activity dot — driven by whether there's anything in the
 * day's plan, not fabricated events on other days.
 */
export function ContextCalendarPanel({ dailyPlan }: { dailyPlan: OverviewData["dailyPlan"] }) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const headerLabel = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Section>
      <div className="surface-card rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-title">{headerLabel}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWeekStart((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Previous week"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Next week"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="text-[10px] font-medium text-muted-foreground">
              {label}
            </span>
          ))}
          {days.map((d) => {
            const isToday = isSameDay(d, today);
            const hasActivity = isToday && dailyPlan.length > 0;
            return (
              <div key={d.toISOString()} className="flex flex-col items-center gap-1 py-1">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
                <span className={cn("size-1 rounded-full", hasActivity ? "bg-primary" : "bg-transparent")} />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <p className="text-title">Today&apos;s Schedule</p>
          <Link href="/timeline" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        {dailyPlan.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="Nothing scheduled"
            benefit="Free time today — get ahead on something."
            action={{ label: "Browse problems", href: "/problems" }}
            className="border-none bg-transparent py-6"
          />
        ) : (
          <div className="mt-2 space-y-2.5">
            {dailyPlan.slice(0, 5).map((item) => {
              const meta = DAILY_PLAN_TYPE_CATEGORY[item.type as DailyPlanType];
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-accent"
                >
                  <span className={cn("size-2 shrink-0 rounded-full", meta ? `bg-current ${CATEGORY_TEXT[meta.category]}` : "bg-muted-foreground")} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">~{item.estimatedMinutes}m</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
