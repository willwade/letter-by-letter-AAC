const CACHE_NAME = 'aac-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/components/Display.tsx',
  '/components/Scanner.tsx',
  '/components/Controls.tsx',
  '/icon.svg',
  '/manifest.json',
  '/data/aac_lexicon_en_gb.txt',
  '/data/default_corpus.txt'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      // Force the waiting service worker to become the active service worker.
      .then(() => self.skipWaiting())
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    // Tell the active service worker to take control of the page immediately.
    }).then(() => self.clients.claim())
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Use a network-first strategy.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response.
        if (
          !response ||
          response.status !== 200
        ) {
          return response;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If the network request fails, try to get it from the cache.
        return caches.match(event.request);
      })
  );
});
