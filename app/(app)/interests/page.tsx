import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { InterestsWorkspace } from "@/components/interests/interests-workspace";
import type { Interest } from "@/lib/interests/types";

export default async function InterestsPage() {
  const user = await requireUser("/interests");
  const client = await createClient();
  const query = client as unknown as { from: (table: string) => any };
  const { data } = await query.from("interests").select("*").eq("user_id", user.id).neq("status", "archived").order("updated_at", { ascending: false });
  return <PageTransition><PageHeader title="Interests" description="Long-term learning areas with notes, projects, goals, and time that compounds." /><InterestsWorkspace interests={(data ?? []) as Interest[]} /></PageTransition>;
}
