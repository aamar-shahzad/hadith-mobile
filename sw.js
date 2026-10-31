const CACHE_NAME = "hadith-mobile-v7";

function isAppShellRequest(url) {
  try {
    const path = new URL(url).pathname;
    return (
      path.includes("/hadith-mobile") &&
      (path.endsWith("/hadith-mobile/") ||
        path.endsWith("/hadith-mobile") ||
        path.endsWith("/index.html") ||
        path.includes("manifest.webmanifest") ||
        path.includes("/icons/") ||
        path.endsWith("/sw.js"))
    );
  } catch {
    return false;
  }
}

function isHadithDataRequest(url) {
  return url.includes("cdn.jsdelivr.net/gh/fawazahmed0/hadith-api");
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
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
      fetch(event.request)
        .then((response) => {
          if (response.ok && isAppShellRequest(url)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  if (isHadithDataRequest(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        });
      }),
    );
  }
});
