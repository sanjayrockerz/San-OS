import { AppShell } from "@/components/layout/app-shell";
import { requireContext, ensureProfile } from "@/lib/server/context";
import { PostActionPrompt } from "@/components/ui/post-action-prompt";

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
  const unreadCount = await services.repos.notifications
    .unreadCount(user.id)
    .catch(() => 0);

  return (
    <AppShell
      user={{ displayName, email: user.email ?? null }}
      unreadCount={unreadCount}
    >
      {children}
      <PostActionPrompt />
    </AppShell>
  );
}
