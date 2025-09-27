
const CACHE_VERSION = 'fdn-v35-202509271524';
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css?v=35',
  './scripts/algorithms.js?v=35',
  './scripts/app.js?v=35',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-180.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_VERSION ? caches.delete(k) : Promise.resolve()))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isHTML = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('.html');
  if (isHTML) {
    event.respondWith((async () => {
      try {
        const net = await fetch(event.request);
        const cache = await caches.open(CACHE_VERSION);
        cache.put(event.request, net.clone());
        return net;
      } catch (e) {
        const cache = await caches.open(CACHE_VERSION);
        const res = await cache.match(event.request) || await cache.match('./index.html');
        return res;
      }
    })());
  } else {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const net = await fetch(event.request);
        cache.put(event.request, net.clone());
        return net;
      } catch (e) {
        return cached || Response.error();
      }
    })());
  }
});
