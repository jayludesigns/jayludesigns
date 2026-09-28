/**
 * Service worker de JayLu.
 *
 * Es un worker clásico (no el empaquetado de Next) a propósito: así el
 * precaché se puede versionar a mano y el archivo se lee sin desempaquetar nada.
 *
 * Estrategias:
 *  · navegación      → red primero, caché como respaldo (si no hay red se
 *                      sirve /offline con la consulta guardada en la URL)
 *  · /_next/static   → caché primero: los assets llevan hash, no cambian
 *  · imágenes        → stale-while-revalidate: se ven al instante y se
 *                      refrescan en segundo plano
 *  · API y POST      → solo red, nunca caché
 *
 * En desarrollo (localhost · puerto 3000) el worker NO cachea nada: cada
 * recarga ve los cambios al momento. Para invalidar una versión desplegada
 * se sube `VERSION`: al activarse se borran todas las cachés anteriores.
 */

const VERSION = "jaylu-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const IMAGE_CACHE = `${VERSION}-images`;

const OFFLINE_URL = "/offline";

/** ¿Estamos en `next dev`? Por hostname y puerto: ahí nunca hay caché. */
const DEV =
  /^(:?localhost|127\.0\.0\.1)$/.test(self.location.hostname) ||
  self.location.port === "3000";

/** Lo mínimo para que la app abra sin conexión. */
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brand/logo-jaylu.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (DEV) {
        // En desarrollo el worker solo existe para purgar cachés viejas y
        // quedarse de brazos cruzados: nada de precaché.
        await self.skipWaiting();
        return;
      }
      const cache = await caches.open(SHELL_CACHE);
      // addAll falla entero si un recurso falla: se van añadiendo de a uno.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => (DEV ? true : !key.startsWith(VERSION)))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

/* ------------------------------------------------------------------ */
/* Estrategias                                                         */
/* ------------------------------------------------------------------ */

function isImage(request) {
  return (
    request.destination === "image" ||
    /\.(png|jpe?g|gif|webp|avif|svg|ico)$/i.test(new URL(request.url).pathname)
  );
}

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/demo/");
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => undefined);
  return hit ?? (await network) ?? new Response("", { status: 504 });
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone()).catch(() => undefined);
    return response;
  } catch {
    // Sin red: se sirve la página offline conservando la URL pedida para que
    // al volver la navegación apunte a donde el usuario quería ir.
    const fallback = await cache.match(request);
    if (fallback) return fallback;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response(
      "<!doctype html><meta charset=utf-8><title>Sin conexión</title>" +
        "<body style='font-family:system-ui;padding:2rem'>No hay conexión y esta " +
        "página no estaba guardada.</body>",
      { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
}

/* ------------------------------------------------------------------ */

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // En desarrollo el worker no intercepta nada: todo va a la red y cada
  // recarga muestra los cambios. En producción sí se aplican las estrategias.
  if (DEV) return;

  // Nunca cacheamos datos vivos ni el panel.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isImage(request)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  }
});