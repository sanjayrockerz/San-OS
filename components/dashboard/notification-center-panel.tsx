"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Bell, Check, Clock } from "lucide-react";

import { Section } from "@/components/layout/page-transition";
import { SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  completeNotification,
  snoozeNotification,
  type ActionResult,
} from "@/app/(app)/notifications/actions";
import type { Tables } from "@/types/database";

type NotificationRow = Tables<"notifications">;

const initialResult: ActionResult | null = null;

function NotificationItem({ notification }: { notification: NotificationRow }) {
  const [, completeAction, completing] = useActionState(completeNotification, initialResult);
  const [, snoozeAction, snoozing] = useActionState(snoozeNotification, initialResult);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{notification.title}</span>
      <form action={snoozeAction}>
        <input type="hidden" name="notificationId" value={notification.id} />
        <input type="hidden" name="days" value="1" />
        <Button type="submit" size="sm" variant="ghost" disabled={snoozing} title="Snooze 1 day">
          <Clock className="size-4" />
        </Button>
      </form>
      <form action={completeAction}>
        <input type="hidden" name="notificationId" value={notification.id} />
        <Button type="submit" size="sm" variant="ghost" disabled={completing} title="Complete">
          <Check className="size-4" />
        </Button>
      </form>
    </div>
  );
}

export function NotificationCenterPanel({
  items,
}: {
  items: NotificationRow[];
}) {
  const unreadCount = items.filter((n) => n.state === "unread").length;

  return (
    <Section>
      <div className="surface-card rounded-2xl p-5">
        <SectionHeading
          title="Notification Center"
          action={
            <Link href="/notifications" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          }
        />
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Bell className="size-6 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium">Nothing waiting on you</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {unreadCount > 0 && <Badge>{unreadCount} unread</Badge>}
            </div>
            {items.slice(0, 5).map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
