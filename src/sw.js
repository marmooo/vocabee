const cacheName = "2025-11-20 00:00";
const urlsToCache = [
  "/vocabee/index.js",
  "/vocabee/drill.js",
  "/vocabee/mp3/incorrect1.mp3",
  "/vocabee/mp3/correct3.mp3",
  "/vocabee/favicon/favicon.svg",
  "https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css",
  "https://cdn.jsdelivr.net/npm/draggabilly@3.0.0/dist/draggabilly.pkgd.min.js",
];

async function preCache() {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urlsToCache.map((url) =>
      cache.add(url).catch((e) => console.warn("Failed to cache", url, e))
    ),
  );
  self.skipWaiting();
}

async function handleFetch(event) {
  const cached = await caches.match(event.request);
  return cached || fetch(event.request);
}

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((name) => name !== cacheName ? caches.delete(name) : null),
  );
  self.clients.claim();
}

self.addEventListener("install", (event) => {
  event.waitUntil(preCache());
});
self.addEventListener("fetch", (event) => {
  event.respondWith(handleFetch(event));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(cleanOldCaches());
});
