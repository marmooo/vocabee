const CACHE_NAME="2023-08-18 00:05",urlsToCache=["/vocabee/","/vocabee/index.js","/vocabee/drill/","/vocabee/drill.js","/vocabee/mp3/incorrect1.mp3","/vocabee/mp3/correct3.mp3","/vocabee/favicon/favicon.svg","https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css","https://cdn.jsdelivr.net/npm/draggabilly@3.0.0/dist/draggabilly.pkgd.min.js"];self.addEventListener("install",a=>{a.waitUntil(caches.open(CACHE_NAME).then(a=>a.addAll(urlsToCache)))}),self.addEventListener("fetch",a=>{a.respondWith(caches.match(a.request).then(b=>b||fetch(a.request)))}),self.addEventListener("activate",a=>{a.waitUntil(caches.keys().then(a=>Promise.all(a.filter(a=>a!==CACHE_NAME).map(a=>caches.delete(a)))))})