const CACHE_VERSION = 'keiner-v11';
const ASSET_CACHE = `assets-${CACHE_VERSION}`;
const HTML_CACHE = `html-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/styles.css',
  '/script.js',
  '/logo%20keiner.png',
  '/WhatsApp%20Image%202026-08-13%20at%2018.36.23.jpeg',
  '/que-es-una-reunion-kick-off-1200x900.jpg',
  '/assets/images/favicon.svg',
  '/assets/images/corporativo-01.svg',
  '/assets/images/corporativo-02.svg',
  '/assets/images/corporativo-03.svg',
  '/assets/images/corporativo-04.svg',
  '/index.html',
  '/servicios.html',
  '/casos.html',
  '/nosotros.html',
  '/contacto.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSET_CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![ASSET_CACHE, HTML_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/\.(css|js|svg|png|jpg|jpeg|webp|avif|ico)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return caches.match('/index.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
