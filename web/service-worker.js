const CACHE_NAME = "yactun-pwa-v2";

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request);
    })
  );
});
