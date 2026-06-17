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
  const preferences = await safe(
    services.repos.userPreferences.findByUser(user.id),
    null as Tables<"user_preferences"> | null,
  );

  return <SettingsClient preferences={preferences} />;
}
