import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StudentAction } from "@/lib/services";
import { ACTION_LABEL_BY_KIND } from "@/lib/services";
import { CATEGORY_TINT } from "@/lib/design/category";
import { STUDENT_ACTION_SOURCE_META } from "@/lib/design/status";

/** A single {@link StudentAction} rendered as a clickable row — shared between Mission Control and the Knowledge Command Center so the two surfaces stay visually identical. */
export function ActionRow({ action }: { action: StudentAction }) {
  const meta = STUDENT_ACTION_SOURCE_META[action.source];
  const Icon = meta.icon;
  const ctaLabel = ACTION_LABEL_BY_KIND[action.kind] ?? "Open";

  return (
    <Link
      href={action.href}
      className="lift group flex items-start gap-3 rounded-xl border border-border bg-card p-3"
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          CATEGORY_TINT[meta.category],
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium line-clamp-1">{action.title}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">{action.detail}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1 self-center text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        {ctaLabel} <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}
