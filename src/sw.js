var CACHE_NAME = '2021-07-24 18:35';
var urlsToCache = [
  '/vocabee/',
  '/vocabee/index.js',
  '/vocabee/drill/',
  '/vocabee/drill/drill.js',
  '/vocabee/mp3/incorrect1.mp3',
  '/vocabee/mp3/correct3.mp3',
  '/vocabee/favicon/original.svg',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js',
  'https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css',
  'https://cdn.jsdelivr.net/npm/draggabilly@2.3.0/dist/draggabilly.pkgd.min.js',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
    .open(CACHE_NAME)
    .then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
