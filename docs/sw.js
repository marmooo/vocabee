var CACHE_NAME="2022-11-26 12:58",urlsToCache=["/vocabee/","/vocabee/index.js","/vocabee/drill/","/vocabee/drill.js","/vocabee/mp3/incorrect1.mp3","/vocabee/mp3/correct3.mp3","/vocabee/favicon/favicon.svg","https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css","https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js","https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css","https://cdn.jsdelivr.net/npm/draggabilly@3.0.0/dist/draggabilly.pkgd.min.js"];self.addEventListener("install",function(a){a.waitUntil(caches.open(CACHE_NAME).then(function(a){return a.addAll(urlsToCache)}))}),self.addEventListener("fetch",function(a){a.respondWith(caches.match(a.request).then(function(b){return b||fetch(a.request)}))}),self.addEventListener("activate",function(a){var b=[CACHE_NAME];a.waitUntil(caches.keys().then(function(a){return Promise.all(a.map(function(a){if(b.indexOf(a)===-1)return caches.delete(a)}))}))})