const CACHE_NAME="2024-04-13 20:00",urlsToCache=["/vocabee/","/vocabee/index.js","/vocabee/drill/","/vocabee/drill.js","/vocabee/mp3/incorrect1.mp3","/vocabee/mp3/correct3.mp3","/vocabee/favicon/favicon.svg","https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css","https://cdn.jsdelivr.net/npm/draggabilly@3.0.0/dist/draggabilly.pkgd.min.js"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})