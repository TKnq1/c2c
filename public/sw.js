const OFFLINE_URL = "/offline.html";
const CACHE_NAME = "c2c-shell-v1";

// Precaches just the offline fallback page — everything else in this app
// is live data (feed, messages, payments), so caching pages themselves
// would show stale content as if it were current, which is worse than a
// clear "you're offline" page. skipWaiting/clients.claim so this takes
// over immediately rather than only after every open tab closes.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

self.addEventListener("push", (event) => {
  let data = { title: "C2C", body: "" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // Malformed payload — fall back to the defaults above.
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "C2C", {
      body: data.body || "",
      icon: "/apple-icon",
      data: { url: data.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/dashboard";
  event.waitUntil(self.clients.openWindow(url));
});
