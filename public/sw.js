const CACHE_NAME = 'aac-pwa-cache-v3';
const urlsToCache = [
  // Core app files
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/data/aac_lexicon_en_gb.txt',
  '/data/default_corpus.txt',

  // Third-party CDN resources
  'https://cdn.tailwindcss.com'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache core files, but don't fail if some are missing
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('Failed to cache some resources during install:', err);
        });
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
  const { request } = event;
  const url = new URL(request.url);

  // Use network-first strategy for app resources
  // This ensures we always get the latest version when online
  event.respondWith(
    fetch(request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Only cache same-origin requests and specific CDN resources
        const shouldCache =
          url.origin === location.origin ||
          url.hostname === 'cdn.tailwindcss.com' ||
          url.hostname === 'cdn.jsdelivr.net';

        if (shouldCache) {
          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If not in cache and it's a navigation request, return index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }

          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});