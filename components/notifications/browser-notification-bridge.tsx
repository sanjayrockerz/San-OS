"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Bell, X } from "lucide-react";
import {
  getNotificationProvider,
  type NotificationPermissionState,
} from "@/lib/notifications/notification-provider";

export interface BridgeNotification {
  id: string;
  title: string;
  body?: string | null;
  href: string;
}

const SEEN_KEY = "sanos_notified_ids";
const DISMISS_KEY = "sanos_notif_prompt_dismissed";
/** Cap how many native toasts fire in one page load, newest first. */
const MAX_TOASTS = 3;

// --- permission store (useSyncExternalStore: SSR-safe, no setState-in-effect) ---
const permListeners = new Set<() => void>();
function permSubscribe(cb: () => void): () => void {
  permListeners.add(cb);
  if (typeof window !== "undefined") {
    window.addEventListener("focus", cb);
  }
  return () => {
    permListeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("focus", cb);
  };
}
function permSnapshot(): NotificationPermissionState {
  return getNotificationProvider().getPermission();
}
function permServer(): NotificationPermissionState {
  return "unsupported";
}
function emitPermChange() {
  permListeners.forEach((l) => l());
}

// --- dismissed flag store (persisted in localStorage) ---
const dismissListeners = new Set<() => void>();
function dismissSubscribe(cb: () => void): () => void {
  dismissListeners.add(cb);
  return () => dismissListeners.delete(cb);
}
function dismissSnapshot(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}
function dismissServer(): boolean {
  return true; // never render the prompt during SSR
}
function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
  dismissListeners.forEach((l) => l());
}

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}
function saveSeen(ids: Set<string>) {
  try {
    // Keep the set bounded so it can't grow without limit.
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* ignore */
  }
}

/**
 * Mounts once in the app shell. Registers the service worker, surfaces new
 * unread notifications (especially the Daily Planner's "why" messages) as free
 * native browser notifications, and offers a one-tap permission prompt. All
 * delivery goes through {@link getNotificationProvider}, never a concrete engine.
 */
export function BrowserNotificationBridge({ notifications }: { notifications: BridgeNotification[] }) {
  const permission = useSyncExternalStore(permSubscribe, permSnapshot, permServer);
  const dismissed = useSyncExternalStore(dismissSubscribe, dismissSnapshot, dismissServer);
  const provider = getNotificationProvider();

  // Register the SW transport once.
  useEffect(() => {
    void provider.ensureReady();
  }, [provider]);

  // Fire native notifications for newly-arrived items. On the very first visit
  // (no seen-set yet) we seed silently so the user isn't buried under a burst.
  useEffect(() => {
    if (permission !== "granted" || notifications.length === 0) return;

    const hadSeenBefore = (() => {
      try {
        return localStorage.getItem(SEEN_KEY) !== null;
      } catch {
        return false;
      }
    })();

    const seen = loadSeen();
    const fresh = notifications.filter((n) => !seen.has(n.id));
    if (fresh.length === 0) return;

    if (hadSeenBefore) {
      for (const n of fresh.slice(0, MAX_TOASTS)) {
        void provider.notify({
          id: n.id,
          title: n.title,
          body: n.body ?? undefined,
          href: n.href,
        });
      }
    }
    for (const n of notifications) seen.add(n.id);
    saveSeen(seen);
  }, [notifications, permission, provider]);

  const showPrompt = permission === "default" && !dismissed;
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs animate-in fade-in slide-in-from-bottom-2">
      <div className="surface-card flex items-start gap-3 rounded-2xl border border-border p-4 shadow-lg">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Enable notifications</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Get your planner&apos;s nudges and due reminders even when this tab isn&apos;t open. Free, on-device — no account needed.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await provider.requestPermission();
                emitPermChange();
              }}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={setDismissed}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={setDismissed}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
