"use client";

import { useActionState, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Constants, type Tables } from "@/types/database";
import type { MissedWorkItem } from "@/lib/services";
import {
  completeNotification,
  createReminder,
  deleteReminder,
  markRead,
  snoozeNotification,
  updateReminder,
  type ActionResult,
} from "@/app/(app)/notifications/actions";
import { REMINDER_CATEGORY_LABEL } from "@/lib/design/status";
import Link from "next/link";
import { X } from "lucide-react";

type NotificationRow = Tables<"notifications">;
type ReminderRow = Tables<"reminders">;

function categoryLabel(category: string | null) {
  if (!category) return null;
  return REMINDER_CATEGORY_LABEL[category] ?? category;
}

function formatDue(dueAt: string | null) {
  if (!dueAt) return null;
  return new Date(dueAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const initialActionResult: ActionResult | null = null;

function NotificationCard({ notification }: { notification: NotificationRow }) {
  const [completeResult, completeAction, completing] = useActionState(
    completeNotification,
    initialActionResult,
  );
  const [snoozeResult, snoozeAction, snoozing] = useActionState(
    snoozeNotification,
    initialActionResult,
  );
  const [, readAction] = useActionState(markRead, initialActionResult);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bell className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{notification.title}</p>
          {notification.state === "snoozed" && (
            <Badge variant="secondary">Snoozed</Badge>
          )}
        </div>
        {notification.body && (
          <p className="text-sm text-muted-foreground">{notification.body}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {categoryLabel(notification.category) && (
            <Badge variant="outline">{categoryLabel(notification.category)}</Badge>
          )}
          {formatDue(notification.due_at) && <span>Due {formatDue(notification.due_at)}</span>}
        </div>
        {(completeResult && !completeResult.ok) && (
          <p className="text-xs text-danger">{completeResult.error}</p>
        )}
        {(snoozeResult && !snoozeResult.ok) && (
          <p className="text-xs text-danger">{snoozeResult.error}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-1.5">
        {notification.state === "unread" && (
          <form action={readAction}>
            <input type="hidden" name="notificationId" value={notification.id} />
            <Button type="submit" size="sm" variant="ghost" title="Mark read">
              <Bell className="size-4" />
            </Button>
          </form>
        )}
        <form action={snoozeAction}>
          <input type="hidden" name="notificationId" value={notification.id} />
          <input type="hidden" name="days" value="1" />
          <Button type="submit" size="sm" variant="outline" disabled={snoozing} title="Snooze 1 day">
            <Clock className="size-4" />
          </Button>
        </form>
        <form action={completeAction}>
          <input type="hidden" name="notificationId" value={notification.id} />
          <Button type="submit" size="sm" disabled={completing} title="Complete">
            <Check className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MissedWorkCard({ item }: { item: MissedWorkItem }) {
  const [result, completeAction, pending] = useActionState(
    completeNotification,
    initialActionResult,
  );
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
        <AlertTriangle className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {categoryLabel(item.category) && (
            <Badge variant="outline">{categoryLabel(item.category)}</Badge>
          )}
          <span>
            {item.overdueDays === 0 ? "Due today" : `${item.overdueDays}d overdue`}
          </span>
        </div>
        {result && !result.ok && <p className="text-xs text-danger">{result.error}</p>}
      </div>
      <form action={completeAction}>
        <input type="hidden" name="notificationId" value={item.notificationId} />
        <Button type="submit" size="sm" disabled={pending}>
          Resolve
        </Button>
      </form>
    </div>
  );
}

function ReminderRowItem({ reminder }: { reminder: ReminderRow }) {
  const [pauseResult, pauseAction] = useActionState(updateReminder, initialActionResult);
  const [, deleteAction] = useActionState(deleteReminder, initialActionResult);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{reminder.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{categoryLabel(reminder.category)}</Badge>
          <span className="capitalize">{reminder.recurrence.replace("_", " ")}</span>
          <span className="capitalize">{reminder.status}</span>
        </div>
        {pauseResult && !pauseResult.ok && (
          <p className="text-xs text-danger">{pauseResult.error}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-1.5">
        <form action={pauseAction}>
          <input type="hidden" name="reminderId" value={reminder.id} />
          <input
            type="hidden"
            name="status"
            value={reminder.status === "active" ? "paused" : "active"}
          />
          <Button type="submit" size="sm" variant="outline">
            {reminder.status === "active" ? <BellOff className="size-4" /> : <Bell className="size-4" />}
          </Button>
        </form>
        <form action={deleteAction}>
          <input type="hidden" name="reminderId" value={reminder.id} />
          <Button type="submit" size="sm" variant="ghost" title="Delete">
            <Trash2 className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function CreateReminderForm({ defaultCategory = "learning_dsa" }: { defaultCategory?: string }) {
  const [result, action, pending] = useActionState(createReminder, initialActionResult);
  const [recurrence, setRecurrence] = useState<string>("one_time");
  const categories = Constants.public.Enums.reminder_category;
  const recurrences = Constants.public.Enums.reminder_recurrence;

  return (
    <form action={action} className="surface-card space-y-4 rounded-2xl p-5">
      <SectionHeading title="New Reminder" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Practice DSA" required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} placeholder="Optional details" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" defaultValue={defaultCategory}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recurrence">Recurrence</Label>
          <Select
            id="recurrence"
            name="recurrence"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
          >
            {recurrences.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        {recurrence === "custom" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="intervalDays">Every N days</Label>
              <Input id="intervalDays" name="intervalDays" type="number" min={1} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="intervalWeeks">Every N weeks</Label>
              <Input id="intervalWeeks" name="intervalWeeks" type="number" min={1} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="intervalMonths">Every N months</Label>
              <Input id="intervalMonths" name="intervalMonths" type="number" min={1} />
            </div>
          </>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="scheduledAt">First due</Label>
          <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
        </div>
      </div>
      {result && !result.ok && <p className="text-xs text-danger">{result.error}</p>}
      <Button type="submit" disabled={pending}>
        <Plus className="mr-1.5 size-4" />
        {pending ? "Creating…" : "Create Reminder"}
      </Button>
    </form>
  );
}

interface Props {
  notifications: NotificationRow[];
  missedWork: MissedWorkItem[];
  reminders: ReminderRow[];
  categoryFilter?: readonly string[] | null;
}

export function NotificationsClient({
  notifications,
  missedWork,
  reminders,
  categoryFilter,
}: Props) {
  const filterSet = categoryFilter ? new Set(categoryFilter) : null;
  const visibleNotifications = filterSet
    ? notifications.filter((n) => n.category && filterSet.has(n.category))
    : notifications;
  const visibleMissedWork = filterSet
    ? missedWork.filter((m) => m.category && filterSet.has(m.category))
    : missedWork;
  const visibleReminders = filterSet
    ? reminders.filter((r) => filterSet.has(r.category))
    : reminders;

  const unread = visibleNotifications.filter((n) => n.state === "unread");
  const rest = visibleNotifications.filter((n) => n.state !== "unread");

  return (
    <PageTransition>
      <PageHeader
        title={filterSet ? "Personal" : "Notifications"}
        description={
          filterSet
            ? "Relationships, family, sleep, exercise, and priorities — everything due, missed, or waiting on you."
            : "Everything due, missed, or waiting on you — SanOS remembers so you don't have to."
        }
      />

      {filterSet && (
        <Link
          href="/notifications"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" /> Showing Personal only — view all notifications
        </Link>
      )}

      {visibleMissedWork.length > 0 && (
        <Section className="mb-6">
          <SectionHeading title={`While you were away (${visibleMissedWork.length})`} />
          <div className="space-y-2">
            {visibleMissedWork.map((item) => (
              <MissedWorkCard key={item.notificationId} item={item} />
            ))}
          </div>
        </Section>
      )}

      <Section className="mb-6">
        <SectionHeading title="Notification Center" />
        {visibleNotifications.length === 0 ? (
          <EmptyState icon={Bell} title="Nothing here yet" description="Due reminders, revisions, and assignments will show up here." />
        ) : (
          <div className="space-y-2">
            {[...unread, ...rest].map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        )}
      </Section>

      <Section className="mb-6">
        <CreateReminderForm defaultCategory={filterSet ? "personal_relationships" : "learning_dsa"} />
      </Section>

      <Section>
        <SectionHeading title="Your Reminders" />
        {visibleReminders.length === 0 ? (
          <EmptyState icon={Clock} title="No reminders yet" description="Create one above to get started." />
        ) : (
          <div className="space-y-2">
            {visibleReminders.map((r) => (
              <ReminderRowItem key={r.id} reminder={r} />
            ))}
          </div>
        )}
      </Section>
    </PageTransition>
  );
}
