"use server";

import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";
import { revalidatePath } from "next/cache";

interface IntakeFormData {
  text: string;
  currentProjectId?: string;
  currentClientId?: string;
}

export async function submitIntake(data: IntakeFormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const services = createServices(supabase);
  const result = await services.universalIntake.process(user.id, {
    text: data.text,
    currentProjectId: data.currentProjectId,
    currentClientId: data.currentClientId,
  });

  revalidatePath("/intake");
  revalidatePath("/knowledge");
  revalidatePath("/timeline");

  return { success: true, result };
}

export async function quickProject(text: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const services = createServices(supabase);
  const { project, clientName } = await services.project.createFromNaturalText(
    user.id,
    text,
  );

  revalidatePath("/projects");
  revalidatePath("/clients");

  return { success: true, project, clientName };
}

export async function quickClient(text: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const services = createServices(supabase);
  const { client } = await services.client.createFromNaturalText(
    user.id,
    text,
  );

  revalidatePath("/clients");

  return { success: true, client };
}
