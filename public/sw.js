const CACHE_NAME = 'disa-hub-cache-v2'; // Bump version on app shell changes
const URLS_TO_CACHE = [
  '/',
  '/index.html',
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Network-first fetching strategy
self.addEventListener('fetch', event => {
    // We only cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // For navigation requests, use network-first
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return fetch(event.request)
                .then(response => {
                    // If we get a valid response, update the cache
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }
                    return response;
                })
                .catch(() => {
                    // If the network fails, try to serve from cache
                    return cache.match(event.request).then(response => {
                        return response || Promise.reject('no-match');
                    });
                });
        })
    );
});