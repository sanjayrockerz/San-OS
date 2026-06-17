"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Brain,
  Library,
  Network,
  GraduationCap,
  Zap,
  LogIn,
  FileCode,
  AlertCircle,
  ChevronDown,
  Activity,
} from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TimelineEntry {
  id: string;
  eventType: string;
  text: string;
  href: string | null;
  at: string;
  timeLabel: string;
}

export interface TimelineDay {
  label: string;
  dateKey: string;
  entries: TimelineEntry[];
}

function eventIcon(eventType: string) {
  if (eventType.startsWith("problem.solved") || eventType === "problem.created")
    return { Icon: CheckCircle2, color: "text-success", bg: "bg-success/12" };
  if (eventType.startsWith("revision."))
    return { Icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-400/12" };
  if (eventType.startsWith("concept."))
    return { Icon: Brain, color: "text-purple-400", bg: "bg-purple-400/12" };
  if (eventType.startsWith("knowledge."))
    return { Icon: Library, color: "text-amber-400", bg: "bg-amber-400/12" };
  if (eventType.startsWith("taxonomy."))
    return { Icon: Network, color: "text-primary", bg: "bg-primary/12" };
  if (eventType.startsWith("assignment.") || eventType.startsWith("lecture.") || eventType.startsWith("document."))
    return { Icon: GraduationCap, color: "text-pink-400", bg: "bg-pink-400/12" };
  if (eventType.startsWith("roadmap."))
    return { Icon: BookOpen, color: "text-green-400", bg: "bg-green-400/12" };
  if (eventType === "code_version.created")
    return { Icon: FileCode, color: "text-cyan-400", bg: "bg-cyan-400/12" };
  if (eventType === "battleplan.task_completed")
    return { Icon: Zap, color: "text-warning", bg: "bg-warning/12" };
  if (eventType.startsWith("auth."))
    return { Icon: LogIn, color: "text-muted-foreground", bg: "bg-muted" };
  return { Icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted" };
}

function DayGroup({ day, index }: { day: TimelineDay; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {day.label}
        </span>
        <span className="flex-1 border-t border-border" />
        <Badge variant="secondary">{day.entries.length} events</Badge>
      </div>

      <div className="relative space-y-1 pl-6">
        <span className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

        {day.entries.map((entry) => {
          const { Icon, color, bg } = eventIcon(entry.eventType);

          const inner = (
            <div
              className={cn(
                "group relative flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors",
                entry.href && "hover:border-border hover:bg-accent/50 cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "absolute -left-[22px] top-3.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  bg,
                )}
              >
                <Icon className={cn("size-3", color)} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{entry.text}</p>
              </div>

              <span className="shrink-0 text-[11px] tabular text-muted-foreground">
                {entry.timeLabel}
              </span>
            </div>
          );

          return entry.href ? (
            <Link key={entry.id} href={entry.href}>
              {inner}
            </Link>
          ) : (
            <div key={entry.id}>{inner}</div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function TimelineClient({
  days,
  totalEvents,
}: {
  days: TimelineDay[];
  totalEvents: number;
}) {
  return (
    <PageTransition>
      <PageHeader
        title="Learning Timeline"
        description="Your engineering growth, one event at a time."
        actions={
          <Badge variant="secondary">
            <Activity className="mr-1 size-3" />
            {totalEvents} events
          </Badge>
        }
      />

      {days.length === 0 ? (
        <Section>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="size-10 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium">No activity yet</p>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-xs">
              Solve a problem or add a concept to see your learning journey here.
            </p>
          </div>
        </Section>
      ) : (
        <div className="space-y-8">
          {days.map((day, i) => (
            <DayGroup key={day.dateKey} day={day} index={i} />
          ))}

          <div className="flex justify-center py-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ChevronDown className="size-3.5" />
              Showing the last {totalEvents} events
            </span>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
