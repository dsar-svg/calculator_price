const CACHE = 'calc-precios-v1';
const ASSETS = [
  '/',
  'index.html',
  'css/style.css',
  'js/api.js',
  'js/app.js',
  'manifest.json',
  'icons/icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('dolarvzla.com')) {
    e.respondWith(networkThenCache(e));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

async function networkThenCache(e) {
  try {
    const res = await fetch(e.request);
    const copy = res.clone();
    caches.open(CACHE).then(cache => cache.put(e.request, copy));
    return res;
  } catch {
    const cached = await caches.match(e.request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
