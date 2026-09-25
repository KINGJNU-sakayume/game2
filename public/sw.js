/* A deliberately small service worker for the static GitHub Pages build. */
const CACHE_PREFIX = "after-the-rain-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-v1`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-v1`;

const scopeUrl = new URL(self.registration.scope);
const scopePath = scopeUrl.pathname.endsWith("/") ? scopeUrl.pathname : `${scopeUrl.pathname}/`;
const shellUrl = new URL(scopePath, scopeUrl.origin).href;

const isSuccessfulBasicResponse = (response) =>
  response && response.ok && response.type !== "opaque";

self.addEventListener("install", (event) => {
  // Cache only the known exported root. Optional images are populated at runtime.
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.add(shellUrl)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== SHELL_CACHE && name !== RUNTIME_CACHE)
        .map((name) => caches.delete(name)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (isSuccessfulBasicResponse(response)) {
      await caches.open(SHELL_CACHE)
        .then((cache) => cache.put(request, response.clone()))
        .catch(() => undefined);
    }
    return response;
  } catch {
    return caches.match(request)
      .then((cached) => cached || caches.match(shellUrl))
      .then((cached) => cached || Response.error())
      .catch(() => Response.error());
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE).catch(() => null);
  if (!cache) return fetch(request);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (isSuccessfulBasicResponse(response)) await cache.put(request, response.clone()).catch(() => undefined);
    return response;
  });
  if (cached) {
    void refresh.catch(() => undefined);
    return cached;
  }
  return refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopePath)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  const isHashedNextAsset = url.pathname.includes("/_next/static/");
  const isRuntimeImage = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname);
  if (isHashedNextAsset || isRuntimeImage) event.respondWith(staleWhileRevalidate(request));
});
