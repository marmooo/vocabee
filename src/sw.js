const CACHE_NAME = "2025-04-08 09:00";
const urlsToCache = [
  "/vocabee/",
  "/vocabee/index.js",
  "/vocabee/drill/",
  "/vocabee/drill.js",
  "/vocabee/mp3/incorrect1.mp3",
  "/vocabee/mp3/correct3.mp3",
  "/vocabee/favicon/favicon.svg",
  "https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css",
  "https://cdn.jsdelivr.net/npm/draggabilly@3.0.0/dist/draggabilly.pkgd.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
