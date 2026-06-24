import { redirectIfAuthenticated } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

const ERROR_COPY: Record<string, string> = {
  consent_denied: "You declined access. Sign in again when you're ready.",
  oauth_failed: "Google sign-in failed. Please try again.",
  missing_code: "Sign-in link was incomplete. Please try again.",
  exchange_failed: "That sign-in link expired or was already used.",
};

/**
 * Public sign-in route (outside the `(app)` group, so it has no app shell).
 * Already-authenticated visitors are bounced straight to the app.
 *
 * In Next.js 16 `searchParams` is async — it must be awaited.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  await redirectIfAuthenticated();
  const { next, error } = await searchParams;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--primary) 35%, transparent), transparent 70%)",
        }}
      />
      <div className="w-full max-w-sm">
        <LoginForm next={next} />
        {error && (
          <p className="mt-4 text-center text-xs text-danger">
            {ERROR_COPY[error] ?? "Sign-in failed. Please try again."}
          </p>
        )}
      </div>
    </main>
  );
}
