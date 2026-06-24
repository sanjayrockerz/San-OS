"use client";

import { useActionState, useState } from "react";
import { Terminal } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authAction,
  magicLinkAction,
  type AuthState,
} from "@/app/login/actions";

type Mode = "signin" | "signup" | "magic";

/**
 * Sign-in surface. Email/password (primary, via server actions) plus Google
 * OAuth (secondary). Email/password needs no external provider configuration,
 * so it works out of the box; Google requires the provider enabled in Supabase.
 */
export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    authAction,
    {},
  );
  const [magicState, magicFormAction, magicPending] = useActionState<
    AuthState,
    FormData
  >(magicLinkAction, {});

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setGoogleError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setGoogleError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="surface-card w-full max-w-sm rounded-3xl p-8 shadow-[var(--shadow-lg)]">
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Terminal className="size-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">
          {mode === "signin"
            ? "Welcome back"
            : mode === "signup"
              ? "Create your SanOS"
              : "Sign in with a link"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground text-balance">
          Your personal engineering OS for mastering data structures and
          algorithms.
        </p>
      </div>

      {mode === "magic" ? (
        <form action={magicFormAction} className="space-y-3">
          {next && <input type="hidden" name="next" value={next} />}
          <div className="space-y-1.5">
            <Label htmlFor="magic-email">Email</Label>
            <Input
              id="magic-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={magicPending}
          >
            {magicPending ? "Sending…" : "Send sign-in link"}
          </Button>
        </form>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="mode" value={mode} />
          {next && <input type="hidden" name="next" value={next} />}

          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                name="displayName"
                autoComplete="name"
                placeholder="Sanjay"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={pending}
          >
            {pending
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>
      )}

      {mode !== "magic" && state?.error && (
        <p className="mt-3 text-center text-xs text-danger">{state.error}</p>
      )}
      {mode !== "magic" && state?.message && (
        <p className="mt-3 text-center text-xs text-success">{state.message}</p>
      )}
      {mode === "magic" && magicState?.error && (
        <p className="mt-3 text-center text-xs text-danger">
          {magicState.error}
        </p>
      )}
      {mode === "magic" && magicState?.message && (
        <p className="mt-3 text-center text-xs text-success">
          {magicState.message}
        </p>
      )}

      {mode !== "magic" && (
        <button
          type="button"
          onClick={() => setMode("magic")}
          className="mt-3 block w-full text-center text-xs font-medium text-primary hover:underline"
        >
          Or sign in with an email link
        </button>
      )}

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        size="lg"
        variant="secondary"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={googleLoading}
        type="button"
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </Button>
      {googleError && (
        <p className="mt-3 text-center text-xs text-danger">{googleError}</p>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {mode === "magic" ? (
          <button
            type="button"
            onClick={() => setMode("signin")}
            className="font-medium text-primary hover:underline"
          >
            Back to password sign-in
          </button>
        ) : (
          <>
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.21 7.21 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
