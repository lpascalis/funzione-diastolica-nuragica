
const CACHE_NAME = 'nuragica-v22';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-256.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if(cached) return cached;
    try{
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
      return fresh;
    } catch(e){
      return cached || Response.error();
    }
  })());
});

self.addEventListener('message', (event) => {
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
