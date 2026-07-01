const CACHE_NAME = "ashaz-autoz-v1";
const BASE = self.location.pathname.replace(/\/sw\.js$/, "");

const PRECACHE_URLS = [
  `${BASE}/`,
  `${BASE}/about/`,
  `${BASE}/services/`,
  `${BASE}/vehicles/`,
  `${BASE}/contact/`,
  `${BASE}/install/`,
  `${BASE}/fonts/inter-latin.woff2`,
  `${BASE}/fonts/bruno-ace-latin.woff2`,
  `${BASE}/fonts/lato-latin-300.woff2`,
  `${BASE}/fonts/lato-latin-400.woff2`,
  `${BASE}/fonts/lato-latin-700.woff2`,
  `${BASE}/manifest.json`,
  `${BASE}/favicon.svg`,
  `${BASE}/apple-touch-icon.png`,
  `${BASE}/pwa-192x192.png`,
  `${BASE}/pwa-512x512.png`,
  `${BASE}/ashaz-logo.png`,
  `${BASE}/icon.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match(`${BASE}/`);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
