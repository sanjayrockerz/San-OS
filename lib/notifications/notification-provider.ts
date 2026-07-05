/**
 * Notification delivery — provider abstraction (§14/§15).
 *
 * Business logic (the notification bridge) depends only on this interface, never
 * on a concrete engine. The shipped implementation is
 * {@link BrowserNotificationProvider}, built entirely on free browser APIs — the
 * Notifications API plus a Service Worker — with NO push server and NO paid
 * service. A future transport (web-push via VAPID, native shell, etc.) only has
 * to implement {@link NotificationProvider}; callers stay unchanged.
 */

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

export interface NotificationPayload {
  /** Stable id used for de-duplication and as the notification tag. */
  id: string;
  title: string;
  body?: string;
  /** In-app path to open when the notification is clicked. */
  href?: string;
  icon?: string;
  /** Collapses notifications sharing a tag; defaults to `id`. */
  tag?: string;
}

export interface NotificationProvider {
  readonly id: string;
  /** True when this environment can deliver notifications. */
  isSupported(): boolean;
  getPermission(): NotificationPermissionState;
  requestPermission(): Promise<NotificationPermissionState>;
  /** Ensures any transport (e.g. service worker) is ready. Safe to call repeatedly. */
  ensureReady(): Promise<void>;
  notify(payload: NotificationPayload): Promise<void>;
}

const SERVICE_WORKER_URL = "/sw.js";
const DEFAULT_ICON = "/icon-192.png";

/**
 * Browser-native provider. Prefers the Service Worker's `showNotification`
 * (works on mobile and survives tab focus changes); falls back to the
 * `Notification` constructor where no SW controller is available.
 */
export class BrowserNotificationProvider implements NotificationProvider {
  readonly id = "browser";
  private registration: ServiceWorkerRegistration | null = null;

  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator
    );
  }

  getPermission(): NotificationPermissionState {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission as NotificationPermissionState;
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) return "unsupported";
    if (Notification.permission !== "default") {
      return Notification.permission as NotificationPermissionState;
    }
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  }

  async ensureReady(): Promise<void> {
    if (!this.isSupported() || this.registration) return;
    try {
      this.registration =
        (await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL)) ??
        (await navigator.serviceWorker.register(SERVICE_WORKER_URL));
    } catch {
      // Registration can fail on unsupported/insecure origins — degrade to the
      // Notification constructor path in notify().
      this.registration = null;
    }
  }

  async notify(payload: NotificationPayload): Promise<void> {
    if (this.getPermission() !== "granted") return;
    await this.ensureReady();

    const options: NotificationOptions & { data?: unknown } = {
      body: payload.body,
      icon: payload.icon ?? DEFAULT_ICON,
      tag: payload.tag ?? payload.id,
      data: { href: payload.href ?? "/notifications" },
    };

    const reg = this.registration ?? (await navigator.serviceWorker.ready.catch(() => null));
    if (reg) {
      await reg.showNotification(payload.title, options);
      return;
    }
    // Last resort: direct constructor (desktop only).
    try {
      new Notification(payload.title, options);
    } catch {
      // Silently drop — a failed toast must never break the page.
    }
  }
}

/** Inert provider for SSR / unsupported environments. */
export class NoopNotificationProvider implements NotificationProvider {
  readonly id = "noop";
  isSupported(): boolean {
    return false;
  }
  getPermission(): NotificationPermissionState {
    return "unsupported";
  }
  async requestPermission(): Promise<NotificationPermissionState> {
    return "unsupported";
  }
  async ensureReady(): Promise<void> {}
  async notify(): Promise<void> {}
}

let cached: NotificationProvider | null = null;

/** Resolves the active provider once per session (browser → Browser, else Noop). */
export function getNotificationProvider(): NotificationProvider {
  if (cached) return cached;
  const browser = new BrowserNotificationProvider();
  cached = browser.isSupported() ? browser : new NoopNotificationProvider();
  return cached;
}
