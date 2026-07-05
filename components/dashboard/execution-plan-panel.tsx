"use client";

import { useActionState } from "react";
import { Clock, Play, Check, SkipForward, Plus } from "lucide-react";
import Link from "next/link";
import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { updateBlockStatus } from "@/app/(app)/execution/actions";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type TimeBlock = Tables<"time_blocks">;

const DOMAIN_BAR: Record<string, string> = {
  learning: "bg-primary",
  academic: "bg-blue-500",
  project: "bg-amber-500",
  business: "bg-emerald-500",
  health: "bg-teal-500",
  personal: "bg-muted-foreground",
};

const STATUS_BADGE: Record<TimeBlock["status"], { variant: "secondary" | "default" | "warning" | "success" | "danger"; label: string }> = {
  planned: { variant: "secondary", label: "Planned" },
  in_progress: { variant: "warning", label: "In Progress" },
  completed: { variant: "success", label: "Done" },
  skipped: { variant: "danger", label: "Skipped" },
  postponed: { variant: "default", label: "Later" },
};

function BlockActions({ block }: { block: TimeBlock }) {
  const [, formAction, pending] = useActionState(updateBlockStatus, null);

  if (block.status === "completed" || block.status === "skipped") return null;

  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="blockId" value={block.id} />
      {block.status === "planned" && (
        <>
          <button
            type="submit"
            name="action"
            value="start"
            disabled={pending}
            className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/20"
            title="Start"
          >
            <Play className="size-3" />
          </button>
          <button
            type="submit"
            name="action"
            value="skip"
            disabled={pending}
            className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-accent"
            title="Skip"
          >
            <SkipForward className="size-3" />
          </button>
        </>
      )}
      {block.status === "in_progress" && (
        <>
          <input type="hidden" name="actualMinutes" value={block.estimated_minutes} />
          <button
            type="submit"
            name="action"
            value="complete"
            disabled={pending}
            className="flex size-6 items-center justify-center rounded-md bg-success/10 text-success transition-colors hover:bg-success/20"
            title="Complete"
          >
            <Check className="size-3" />
          </button>
        </>
      )}
    </form>
  );
}

export function ExecutionPlanPanel({ blocks }: { blocks: TimeBlock[] }) {
  const visibleBlocks = blocks.filter((b) => b.status !== "skipped");

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading
          title="Today's Time Blocks"
          action={
            <Link
              href="/execution"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="size-3" /> Add block
            </Link>
          }
        />

        {visibleBlocks.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No time blocks today"
            description="Schedule your day in blocks to track execution."
            benefit="Time blocking improves focus and schedule accuracy."
            action={{ label: "Plan your day", href: "/execution" }}
            className="border-none bg-transparent py-6"
          />
        ) : (
          <div className="space-y-2">
            {visibleBlocks.map((block) => {
              const statusMeta = STATUS_BADGE[block.status];
              const barColor = DOMAIN_BAR[block.domain] ?? DOMAIN_BAR.personal;

              return (
                <div
                  key={block.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    block.status === "completed"
                      ? "border-success/20 bg-success/5 opacity-70"
                      : block.status === "in_progress"
                        ? "border-warning/30 bg-warning/5"
                        : "border-border hover:bg-accent/50",
                  )}
                >
                  <div className={cn("h-8 w-1 shrink-0 rounded-full", barColor)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{block.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="tabular text-[10px] text-muted-foreground">
                        {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">
                        ~{block.estimated_minutes}m
                      </span>
                    </div>
                  </div>
                  <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                  <BlockActions block={block} />
                </div>
              );
            })}

            <div className="mt-1 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {blocks.filter((b) => b.status === "completed").length}/{blocks.length} completed
              </span>
              <span className="tabular text-xs font-medium">
                {blocks.reduce((s, b) => s + b.estimated_minutes, 0)}m planned
              </span>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
