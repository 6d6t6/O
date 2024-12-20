const CACHE_NAME = 'omega-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.svg',
    '/data/languages.json',
    '/data/regions.json',
    '/styles/desktop.css',
    '/styles/main.css',
    '/styles/menu.css',
    '/styles/taskbar.css',
    '/styles/windows.css',
    '/js/apps/activity-monitor.js',
    '/js/apps/finder.js',
    '/js/apps/settings.js',
    '/js/apps/terminal.js',
    '/js/auth/auth-system.js',
    '/js/core/app-system.js',
    '/js/core/app.js',
    '/js/core/context-menu.js',
    '/js/core/desktop.js',
    '/js/core/dock.js',
    '/js/core/filesystem.js',
    '/js/core/menu-bar.js',
    '/js/core/process-manager.js',
    '/js/core/settings-manager.js',
    '/js/core/system.js',
    '/js/core/window-manager.js',
    '/js/main.js',
    // cached files
];

// Install the service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event to serve cached content
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return the cached response if found, otherwise fetch from the network
                return response || fetch(event.request);
            })
    );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
