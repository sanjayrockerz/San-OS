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
  await ensureProfile(services, user);

  return (
    <AppShell>
      {children}
      <PostActionPrompt />
    </AppShell>
  );
}
