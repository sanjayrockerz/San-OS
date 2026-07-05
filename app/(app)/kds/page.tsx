import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { KDSBoard } from "@/components/kds/kds-board";

export default async function KDSPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Load active orders (pending and acknowledged) to populate initial board
  // Load active orders (pending and acknowledged) to populate initial board
  const { data: initialOrders, error } = await (supabase as any)
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["pending", "acknowledged"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load KDS orders", error);
  }

  return (
    <div className="absolute inset-0 bg-background overflow-hidden">
      <KDSBoard initialOrders={(initialOrders as any) || []} />
    </div>
  );
}
