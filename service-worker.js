// Service Worker Script: cache-first with a daily update check

const CACHE_NAME = 'MagicBoard_cache';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon.png',
    './libraries/jszip.min.js',
    './libraries/html2canvas.min.js'
];

// Install: cache static files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }))
        )
    );
    self.clients.claim();
});

async function updateCachedFiles() {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(FILES_TO_CACHE.map(async file => {
        try {
            const response = await fetch(file, { cache: 'no-store' });
            if (response.ok && response.type === 'basic') {
                await cache.put(file, response);
            }
        } catch (error) {
            // Keep the existing cache when the network is unavailable.
        }
    }));
}

self.addEventListener('message', event => {
    if (event.data?.type === 'CHECK_FOR_UPDATE') {
        event.waitUntil(updateCachedFiles());
    }
});

// Fetch: use cached files first and populate the cache on a miss.
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then(networkResponse => {
                if (networkResponse.ok && networkResponse.type === 'basic') {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return networkResponse;
            });
        })
    );
});
