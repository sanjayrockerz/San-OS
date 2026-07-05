"use server";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function getKdsSettings() {
  const user = await requireUser();
  const supabase = await createClient();
  
  const { data, error } = await (supabase as any)
    .from("kds_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();
    
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching KDS settings:", error);
    return null;
  }
  
  if (!data) {
    // Return defaults if none exist
    return {
      volume: 100,
      repeat_interval_sec: 10,
      is_muted: false,
      enable_browser_notifications: true,
      sound_url: "",
    };
  }
  
  return data;
}

export async function updateKdsSettings(payload: {
  volume: number;
  repeat_interval_sec: number;
  is_muted: boolean;
  enable_browser_notifications: boolean;
  sound_url: string;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  
  const { error } = await (supabase as any)
    .from("kds_settings")
    .upsert({
      user_id: user.id,
      ...payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    
  if (error) {
    console.error("Error updating KDS settings:", error);
    throw new Error("Failed to update settings");
  }
  
  return { success: true };
}
