// Service Worker Script: stale-while-revalidate (once per day or if cache missing)

const CACHE_NAME = 'MagicBoard_cache_v6';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon.png',
    './libraries/jszip.min.js',
    './libraries/html2canvas.min.js'
];

const META_KEY = './__last_update_check';

function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function hasCheckedToday() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const res = await cache.match(META_KEY);
        if (res) {
            const dateStr = await res.text();
            return dateStr === getTodayString();
        }
    } catch (e) {}
    return false;
}

async function markCheckedToday() {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(META_KEY, new Response(getTodayString()));
    } catch (e) {}
}

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

// Fetch: check for updates only on first open today or if cache is missing
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        (async () => {
            const cachedResponse = await caches.match(event.request);
            const checkedToday = await hasCheckedToday();

            // If there is no cache to load from, fetch from network and populate cache
            if (!cachedResponse) {
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const clone = networkResponse.clone();
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(event.request, clone);
                    }
                    return networkResponse;
                } catch (err) {
                    return null;
                }
            }

            // If cache exists and app was already opened today (update check already performed today), serve from cache without revalidating
            if (checkedToday) {
                return cachedResponse;
            }

            // First time user opens the app today: mark today as checked & check for updated version in background
            markCheckedToday();

            const fetchPromise = fetch(event.request)
                .then(async networkResponse => {
                    if (networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const clone = networkResponse.clone();
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(event.request, clone);
                    }
                    return networkResponse;
                })
                .catch(() => null);

            return cachedResponse || fetchPromise;
        })()
    );
});
