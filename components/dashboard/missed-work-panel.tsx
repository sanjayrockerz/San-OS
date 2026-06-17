"use client";

import { useActionState } from "react";
import { AlertTriangle } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { completeNotification, type ActionResult } from "@/app/(app)/notifications/actions";
import type { MissedWorkItem } from "@/lib/services";

const initialResult: ActionResult | null = null;

function MissedItem({ item }: { item: MissedWorkItem }) {
  const [, action, pending] = useActionState(completeNotification, initialResult);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3">
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
      <span className="shrink-0 text-xs text-warning">
        {item.overdueDays === 0 ? "today" : `${item.overdueDays}d`}
      </span>
      <form action={action}>
        <input type="hidden" name="notificationId" value={item.notificationId} />
        <Button type="submit" size="sm" disabled={pending}>
          Resolve
        </Button>
      </form>
    </div>
  );
}

/** "While you were away" recovery card. Renders nothing when there's nothing missed. */
export function MissedWorkPanel({ items }: { items: MissedWorkItem[] }) {
  if (items.length === 0) return null;

  return (
    <Section>
      <div className="surface-card rounded-2xl border border-warning/30 p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="size-4 text-warning" />
          <h2 className="text-lg font-semibold tracking-tight">While you were away</h2>
        </div>
        <div className="space-y-2">
          {items.slice(0, 5).map((item) => (
            <MissedItem key={item.notificationId} item={item} />
          ))}
        </div>
      </div>
    </Section>
  );
}
