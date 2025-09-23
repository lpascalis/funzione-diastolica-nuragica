const CACHE_NAME = 'nuragica-v12';
const ASSETS = [
                  './assets/icons/splash-dark-1170x2532.png',
'./assets/icons/splash-light-1170x2532.png',
'./assets/icons/splash-dark-1284x2778.png',
'./assets/icons/splash-light-1284x2778.png',
'./assets/icons/splash-dark-1242x2688.png',
'./assets/icons/splash-light-1242x2688.png',
'./assets/icons/icon-180.png',
'./assets/icons/icon-1024.png',
'./',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => 
      cached || fetch(req).then(resp => {
        // Optionally cache new GET requests
        if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
        }
        return resp;
      }).catch(() => caches.match('./index.html'))
    )
  );
});


self.addEventListener('message', (event) => {
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
  })());
});
