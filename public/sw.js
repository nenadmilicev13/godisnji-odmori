// Minimalni service worker — omogućava instalaciju (PWA) i osnovni offline keš.
const KES = "go-cache-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Network-first uz keš kao rezervu (offline).
  event.respondWith(
    fetch(request)
      .then((res) => {
        const kopija = res.clone();
        caches.open(KES).then((c) => c.put(request, kopija)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request)),
  );
});
