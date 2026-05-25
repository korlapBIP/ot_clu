const CACHE_NAME = "lembur-v15-admin-absensi-back";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./firebase-config.js",
  "./firebase-db.js",
  "./README_DATABASE_FIREBASE.md",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./screenshots/install-dashboard.png",
  "./screenshots/install-report.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
