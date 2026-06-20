import { requireContext } from "@/lib/server/context";
import { SettingsClient } from "@/components/settings/settings-client";
import type { Tables } from "@/types/database";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function SettingsPage() {
  const { user, services } = await requireContext("/settings");
  const [preferences, profile] = await Promise.all([
    safe(
      services.repos.userPreferences.findByUser(user.id),
      null as Tables<"user_preferences"> | null,
    ),
    safe(
      services.repos.profile.findByUserId(user.id),
      null as Tables<"users_profile"> | null,
    ),
  ]);

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "—";

  return (
    <SettingsClient
      preferences={preferences}
      profile={{ displayName, email: user.email ?? "—" }}
    />
  );
}
