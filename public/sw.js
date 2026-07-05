/*
 * SanOS Service Worker — notification transport only.
 *
 * Deliberately minimal: it does NOT cache app assets or intercept fetches, so it
 * can never serve stale pages. Its sole job is to own notification display and
 * click handling for the free browser-notification pipeline (§14/§15). All
 * notifications are triggered client-side via registration.showNotification —
 * there is no push server and no paid service.
 */

self.addEventListener("install", () => {
  // Activate immediately so notifications work on first load.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Focus an existing tab (navigating it to the target) or open a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/notifications";
  const targetUrl = new URL(href, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ("focus" in client) {
          if ("navigate" in client && client.url !== targetUrl) {
            try {
              await client.navigate(targetUrl);
            } catch {
              /* cross-origin or detached — fall through to focus */
            }
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })(),
  );
});
