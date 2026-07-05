"use server";

import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";

export async function getSurroundingContextAction(entityType: string, entityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  const services = createServices(supabase);
  return services.context.getSurroundingContext(user.id, entityType, entityId);
}

export async function getMemoryDiagnosticsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  const services = createServices(supabase);
  return services.memoryHealth.getDiagnostics(user.id);
}
