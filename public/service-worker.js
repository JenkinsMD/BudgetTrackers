//List of files we want to store while offline
const FILES_TO_CACHE = [
  '/',
  '/styles.css',
  '/index.html',
  '/index.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/db.js'
  
];

//Modeled from W19 activities

const STATIC_CACHE = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});


self.addEventListener("activate", event => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        // return array of cache names that are old to delete
        return cacheNames.filter(
          cacheName => !currentCaches.includes(cacheName)
        );
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {

  // non GET requests are not cached
  if (
    event.request.method !== "GET" || 
    !event.request.url.startsWith(self.location.origin)
  ) {
    console.log(event.request)
    //URL
    event.respondWith(fetch(event.request));
    return;
  } 

    //After if, handles GET
    if (event.request.url.includes("/api/transaction")) {
      //make request, use offline storage if not connected to the network
      event.respondWith(
        caches.open(RUNTIME_CACHE).then(cache => {
          return fetch(event.request)
            .then(response => {
              cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => {
              
             return caches.match(event.request)

            });
        })
      );
      console.log("catch all fetch response+++++++" )
      return
    } 

  // use cache first for all other requests for performance
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

   
      return caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.request).then(response => {
          return cache.put(event.request, response.clone()).then(() => {
            return response;
          });
        });
      });
    })
  );
  

});
