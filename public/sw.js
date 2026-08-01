const CACHE_NAME = "eeum-cache-v1";
const urlsToCache = [
  "/",
  "/manifest.json",
  "/globe.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Bypass non-http/s protocols (like chrome-extension://) and Next.js HMR/dev routes
  try {
    const url = new URL(event.request.url);
    if (
      !url.protocol.startsWith("http") ||
      url.pathname.startsWith("/_next") ||
      url.pathname.includes("webpack-hmr") ||
      url.search.includes("ts=") ||
      url.pathname.includes("hot-update")
    ) {
      return;
    }
  } catch (err) {
    return; // Fallback if URL parsing fails
  }

  // Only cache GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Don't cache non-successful or external api requests
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Fallback or ignore
      });
    })
  );
});
