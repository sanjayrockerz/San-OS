"use client";

import { useActionState, useState, useOptimistic } from "react";
import { ChevronDown, ChevronRight, Check, Loader2, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { markRoadmapItem, type ActionResult } from "@/app/(app)/roadmaps/actions";
import type { RoadmapNode } from "@/lib/services";

interface Props {
  roadmapId: string;
  nodes: RoadmapNode[];
}

interface NodeProps {
  node: RoadmapNode;
  roadmapId: string;
  depth?: number;
}

function TreeNode({ node, roadmapId, depth = 0 }: NodeProps) {
  const [open, setOpen] = useState(depth === 0);
  const isSection = node.is_section;
  const isLocked = node.locked;

  const [optimisticStatus, addOptimisticStatus] = useOptimistic(
    node.status,
    (state, newStatus: string) => newStatus as RoadmapNode["status"]
  );
  const isCompleted = optimisticStatus === "completed";

  const [state, action, pending] = useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const statusRaw = formData.get("status") as string;
      addOptimisticStatus(statusRaw);
      return markRoadmapItem(prev, formData);
    },
    null,
  );

  return (
    <div className={cn(depth > 0 && "ml-5 border-l border-border pl-4")}>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
          isSection
            ? "cursor-pointer hover:bg-secondary/50"
            : "hover:bg-secondary/30",
          isLocked && !isSection && "opacity-60",
        )}
        onClick={isSection ? () => setOpen(!open) : undefined}
      >
        {/* Toggle or status */}
        {isSection ? (
          <span className="text-muted-foreground">
            {open ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </span>
        ) : isLocked ? (
          <span
            title={node.dependsOnTitle ? `Complete "${node.dependsOnTitle}" first` : "Locked"}
            className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-border text-muted-foreground"
          >
            <Lock className="size-2.5" />
          </span>
        ) : (
          <form action={action}>
            <input type="hidden" name="roadmapId" value={roadmapId} />
            <input type="hidden" name="itemId" value={node.id} />
            <input
              type="hidden"
              name="status"
              value={isCompleted ? "not_started" : "completed"}
            />
            <button
              type="submit"
              disabled={pending}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                isCompleted
                  ? "border-success bg-success text-success-foreground"
                  : "border-border hover:border-primary",
              )}
            >
              {pending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : isCompleted ? (
                <Check className="size-3" />
              ) : null}
            </button>
          </form>
        )}

        <span
          className={cn(
            "flex-1 text-sm",
            isSection && "font-semibold",
            isCompleted && !isSection && "line-through text-muted-foreground",
          )}
        >
          {node.title}
        </span>

        {/* Section item count — recursive across all descendants, not just direct children */}
        {isSection && node.leafTotal > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {node.leafCompleted}/{node.leafTotal}
          </span>
        )}
      </div>

      {!isSection && state && !state.ok && (
        <p className="ml-8 -mt-1 pb-1.5 text-[11px] text-destructive">{state.error}</p>
      )}

      {/* Children */}
      {isSection && open && node.children.length > 0 && (
        <div className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              roadmapId={roadmapId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RoadmapTree({ roadmapId, nodes }: Props) {
  if (nodes.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
        This roadmap has no items yet.
      </div>
    );
  }

  return (
    <div className="surface-card space-y-0.5 rounded-2xl p-3">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} roadmapId={roadmapId} />
      ))}
    </div>
  );
}
