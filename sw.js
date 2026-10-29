const V = "sayeh-connect-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/logo.png", "icons/icon-192.png", "icons/watermark.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith("/api/jobs")) {
    // réseau d'abord, copie en cache si hors ligne
    e.respondWith(
      fetch(req).then((r) => { const copy = r.clone(); caches.open(V).then((c) => c.put(req, copy)); return r; })
        .catch(() => caches.match(req))
    );
    return;
  }
  // page et fichiers : cache d'abord, mise à jour en arrière-plan
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((r) => { const copy = r.clone(); caches.open(V).then((c) => c.put(req, copy)); return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then((cs) => (cs.length ? cs[0].focus() : clients.openWindow("./"))));
});
