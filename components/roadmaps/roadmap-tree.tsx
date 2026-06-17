"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronRight, Check, Loader2 } from "lucide-react";

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
  const isCompleted = node.status === "completed";

  const [, action, pending] = useActionState(
    (prev: ActionResult | null, formData: FormData) =>
      markRoadmapItem(prev, formData),
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

        {/* Section item count */}
        {isSection && node.children.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {node.children.filter((c) => c.status === "completed").length}/
            {node.children.filter((c) => !c.is_section).length}
          </span>
        )}
      </div>

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
