const CACHE_NAME = "hadith-mobile-v11";
const ASSETS_CACHE = "hadith-mobile-assets-v1";
const PRECACHE_TIMEOUT_MS = 6000;
const NETWORK_TIMEOUT_MS = 4000;

function scopeBasePath() {
  try {
    const path = new URL(self.location.href).pathname;
    const dir = path.replace(/\/[^/]*$/, "/");
    return dir.endsWith("/") ? dir : `${dir}/`;
  } catch {
    return "/";
  }
}

function isAppShellRequest(url) {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const base = scopeBasePath();
    if (
      path.endsWith("/sw.js") ||
      path.includes("manifest.webmanifest") ||
      path.includes("/icons/") ||
      path.includes("/assets/")
    ) {
      return true;
    }
    if (base !== "/" && path.startsWith(base)) {
      return path === base || path.endsWith("/index.html") || path.endsWith(base.slice(0, -1));
    }
    return path.endsWith("/index.html") || path === "/" || path.endsWith("/");
  } catch {
    return false;
  }
}

function isRuntimeAsset(url) {
  return (
    url.includes("unpkg.com/@phosphor-icons") ||
    url.includes("fonts.googleapis.com") ||
    url.includes("fonts.gstatic.com")
  );
}

function isHadithDataRequest(url) {
  return url.includes("cdn.jsdelivr.net/gh/fawazahmed0/hadith-api");
}

function fetchWithTimeout(request, ms) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

async function cachePut(request, response, cacheName) {
  if (!response || !response.ok || response.bodyUsed) return;
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  } catch {
    /* clone/body already consumed */
  }
}

async function staleWhileRevalidateAsset(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res.ok) cachePut(request, res.clone(), ASSETS_CACHE).catch(() => {});
      return res;
    })
    .catch(() => null);
  if (cached) {
    fetchPromise.catch(() => {});
    return cached;
  }
  const networkRes = await fetchPromise;
  return networkRes || Response.error();
}

function precacheShellUrls() {
  const base = scopeBasePath();
  return [
    `${base}index.html`,
    `${base}manifest.webmanifest`,
    `${base}assets/app.css`,
    `${base}icons/icon-192.png`,
    `${base}icons/icon-512.png`,
  ];
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(
        precacheShellUrls().map(async (url) => {
          try {
            const res = await fetchWithTimeout(url, PRECACHE_TIMEOUT_MS);
            if (res.ok) await cache.put(url, res);
          } catch {
            /* skip */
          }
        }),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME && key !== ASSETS_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = event.request.url;

  if (event.request.mode === "navigate" || isAppShellRequest(url)) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetchWithTimeout(event.request, NETWORK_TIMEOUT_MS);
          if (response.ok && isAppShellRequest(url)) {
            event.waitUntil(cachePut(event.request, response, CACHE_NAME));
          }
          return response;
        } catch {
          const cached =
            (await caches.match(event.request, { ignoreSearch: true })) ||
            (await caches.match(scopeBasePath() + "index.html")) ||
            (await caches.match("index.html"));
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  if (isRuntimeAsset(url)) {
    event.respondWith(staleWhileRevalidateAsset(event.request));
    return;
  }

  if (isHadithDataRequest(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        try {
          const res = await fetchWithTimeout(event.request, NETWORK_TIMEOUT_MS);
          if (res.ok) event.waitUntil(cachePut(event.request, res, CACHE_NAME));
          return res;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
  }
});
