/**
 * Single capture point for errors and notable events. Currently logs to the
 * console; swap the bodies of these two functions for `Sentry.captureException`
 * / `posthog.capture` when those providers are wired in — every call site in
 * the app already goes through here, so nothing else needs to change.
 */

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  console.error("[error]", error, context ?? "");
}

export function captureEvent(name: string, properties?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[event]", name, properties ?? "");
  }
}
