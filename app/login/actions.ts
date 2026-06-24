"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createServices } from "@/lib/services";
import { EVENT_TYPES } from "@/lib/services/event.service";
import { signInSchema, signUpSchema } from "@/lib/validators/auth";

export interface AuthState {
  error?: string;
  message?: string;
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  // Only allow same-site absolute paths to avoid open redirects.
  return next.startsWith("/") && !next.startsWith("//") ? next : "/overview";
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "Please confirm your email first — check your inbox for the confirmation link.",
      };
    }
    return { error: error.message };
  }

  if (data.user) {
    await createServices(supabase)
      .events.emit(data.user.id, {
        eventType: EVENT_TYPES.AuthLogin,
        payload: { method: "password" },
      })
      .catch((err) => console.error("[signInAction] event emit failed", err));
  }

  redirect(safeNext(formData.get("next")));
}

export async function magicLinkAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.includes("@")) {
    return { error: "Enter a valid email address" };
  }

  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };

  return { message: "Check your email for a sign-in link." };
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });
  if (error) return { error: error.message };

  // When email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return {
      message:
        "Account created. Check your email to confirm, then sign in below.",
    };
  }

  if (data.user) {
    await createServices(supabase)
      .events.emit(data.user.id, {
        eventType: EVENT_TYPES.AuthLogin,
        payload: { method: "signup" },
      })
      .catch((err) => console.error("[signUpAction] event emit failed", err));
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Single entry point for the email/password form: dispatches to sign-in or
 * sign-up based on the hidden `mode` field, so the client can use one
 * `useActionState` hook across both modes.
 */
export async function authAction(
  prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = formData.get("mode");
  return mode === "signup"
    ? signUpAction(prev, formData)
    : signInAction(prev, formData);
}
