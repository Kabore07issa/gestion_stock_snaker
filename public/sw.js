// Service worker minimal : rend l'application installable et garde
// les fichiers statiques en cache. Les données restent toujours à jour (réseau).
const CACHE = "boutique-v1";
const STATIQUES = ["/icons/icon-192.png", "/icons/icon-512.png", "/logo.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIQUES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Fichiers statiques versionnés de Next.js : cache d'abord
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.match(req).then(
        (r) =>
          r ||
          fetch(req).then((res) => {
            const copie = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copie));
            return res;
          }),
      ),
    );
    return;
  }

  // Pages : réseau, avec message clair si la connexion est coupée
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(
        () =>
          new Response(
            '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;color:#0E2A1E"><div style="text-align:center;padding:24px"><h1 style="font-size:20px">Hors connexion</h1><p style="color:#5C7268">Impossible de joindre le serveur de la boutique.<br>Vérifiez la connexion puis réessayez.</p><button onclick="location.reload()" style="margin-top:12px;min-height:44px;padding:0 20px;border:0;border-radius:6px;background:#0A7A4F;color:#fff;font-weight:600">Réessayer</button></div>',
            { headers: { "Content-Type": "text/html; charset=utf-8" } },
          ),
      ),
    );
  }
});
