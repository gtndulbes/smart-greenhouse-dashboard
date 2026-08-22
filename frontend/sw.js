const CACHE_NAME = 'smart-gh-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/monitoring.html',
  '/control.html',
  '/history.html',
  '/alerts.html',
  '/settings.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/socket.js',
  '/assets/js/state.js',
  '/assets/js/dashboard.js',
  '/assets/js/monitoring.js',
  '/assets/js/control.js',
  '/assets/js/history.js',
  '/assets/js/alerts.js',
  '/assets/js/settings.js',
  '/favicon.ico',
  '/favicon.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});