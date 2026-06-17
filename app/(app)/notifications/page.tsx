import { requireContext } from "@/lib/server/context";
import { NotificationsClient } from "@/components/notifications/notifications-client";
import type { MissedWorkItem } from "@/lib/services";
import type { Tables } from "@/types/database";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/**
 * Notification Center + Missed Work Queue + reminder management. The
 * dashboard at /overview also runs `evaluateForUser`, but this page re-runs
 * it too so it works as a standalone entry point (e.g. opened directly from a
 * push notification deep link in a later phase) without depending on the
 * overview page having loaded first this session.
 */
export default async function NotificationsPage() {
  const { user, services } = await requireContext("/notifications");

  await safe(services.habitEngine.evaluateForUser(user.id), {
    generated: 0,
    expired: 0,
    missed: 0,
    unreadCount: 0,
  });

  const [notifications, missedWork, reminders] = await Promise.all([
    safe(services.habitEngine.getNotificationCenter(user.id), [] as Tables<"notifications">[]),
    safe(services.habitEngine.getMissedWorkQueue(user.id), [] as MissedWorkItem[]),
    safe(services.repos.reminders.findByUser(user.id), [] as Tables<"reminders">[]),
  ]);

  return (
    <NotificationsClient
      notifications={notifications}
      missedWork={missedWork}
      reminders={reminders}
    />
  );
}
