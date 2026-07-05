import { AppShell } from "@/components/layout/app-shell";
import { requireContext, ensureProfile } from "@/lib/server/context";
import { PostActionPrompt } from "@/components/ui/post-action-prompt";
import {
  BrowserNotificationBridge,
  type BridgeNotification,
} from "@/components/notifications/browser-notification-bridge";
import { ContextPanel } from "@/components/layout/context-panel";
import type { Tables } from "@/types/database";

/** In-app landing page for a native-notification click, by its source. */
function notificationHref(n: Tables<"notifications">): string {
  switch (n.source_type) {
    case "system":
      return "/execution";
    case "revision":
      return "/revision";
    case "iit_assignment":
      return "/iit-workspace";
    default:
      return "/notifications";
  }
}

/**
 * Protected layout for every in-app route. The proxy already bounces anonymous
 * visitors to `/login`; this guard is defence-in-depth and also guarantees the
 * user has a `users_profile` row before any page renders.
 */
export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, services } = await requireContext();
  const profile = await ensureProfile(services, user);

  const displayName = profile.display_name ?? user.email?.split("@")[0] ?? "You";
  const [unreadCount, unread] = await Promise.all([
    services.repos.notifications.unreadCount(user.id).catch(() => 0),
    services.repos.notifications
      .findByState(user.id, "unread")
      .catch(() => [] as Tables<"notifications">[]),
  ]);

  const bridgeNotifications: BridgeNotification[] = unread.slice(0, 12).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: notificationHref(n),
  }));

  return (
    <AppShell
      user={{ displayName, email: user.email ?? null }}
      unreadCount={unreadCount}
    >
      {children}
      <ContextPanel />
      <PostActionPrompt />
      <BrowserNotificationBridge notifications={bridgeNotifications} />
    </AppShell>
  );
}
