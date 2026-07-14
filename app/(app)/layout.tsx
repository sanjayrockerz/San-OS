import { AppShell } from "@/components/layout/app-shell";
import { getContext } from "@/lib/server/context";
import { PostActionPrompt } from "@/components/ui/post-action-prompt";
import { ContextPanel } from "@/components/layout/context-panel";

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
    </AppShell>
  );
}
