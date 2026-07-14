import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getContext } from "@/lib/server/context";
import { PostActionPrompt } from "@/components/ui/post-action-prompt";
import { ContextPanel } from "@/components/layout/context-panel";
import {
  BrowserNotificationBridge,
  type BridgeNotification,
} from "@/components/notifications/browser-notification-bridge";
import type { Tables } from "@/types/database";

function notificationHref(n: Tables<"notifications">): string {
  switch (n.source_type) {
    case "system": return "/execution";
    case "revision": return "/revision";
    case "iit_assignment": return "/iit-workspace";
    default: return "/notifications";
  }
}

async function NotificationEnhancements({
  userId,
  services,
}: {
  userId: string;
  services: Awaited<ReturnType<typeof getContext>>["services"];
}) {
  const unread = await services.repos.notifications
    .findByState(userId, "unread")
    .catch(() => [] as Tables<"notifications">[]);
  const notifications: BridgeNotification[] = unread.slice(0, 12).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: notificationHref(n),
  }));
  return <BrowserNotificationBridge notifications={notifications} />;
}

/**
 * Protected layout for every in-app route. The proxy already bounces anonymous
 * visitors to `/login`; this guard is defence-in-depth and also guarantees the
 * user session is available before any page renders. Profile and notification
 * data are intentionally not on this critical path; a slow side query should
 * never hold the whole workspace hostage.
 */
export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getContext();
  if (!ctx.user) {
    return (
      <AppShell user={{ displayName: "Sanjay", email: "dev@local" }} unreadCount={0}>
        {children}
      </AppShell>
    );
  }
  const { user } = ctx;
  const displayName = user.email?.split("@")[0] ?? "You";

  return (
    <AppShell
      user={{ displayName, email: user.email ?? null }}
      unreadCount={0}
    >
      {children}
      <ContextPanel />
      <PostActionPrompt />
      <Suspense fallback={null}>
        <NotificationEnhancements userId={user.id} services={ctx.services} />
      </Suspense>
    </AppShell>
  );
}
