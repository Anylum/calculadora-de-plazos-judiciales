/* Service worker: permite instalar la app y abrirla sin conexión */
const V = 'plazos-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname);
  if (url.origin !== location.origin && !fonts) return;            // Supabase y demás: siempre en línea
  if (req.mode === 'navigate') {                                   // la página: primero la red, luego la copia guardada
    e.respondWith(fetch(req).then(r => { caches.open(V).then(c => c.put(req, r.clone())); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {                     // archivos y fuentes: copia guardada y actualización en segundo plano
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) caches.open(V).then(c => c.put(req, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});
