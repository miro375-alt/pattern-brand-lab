const C = 'pbl-v5';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const isDoc = u.pathname.includes('/docs/');
  e.respondWith(caches.open(C).then(async cache => {
    if (isDoc) { // 네트워크 우선 (항상 최신 암호문), 오프라인만 캐시
      try { const r = await fetch(e.request); if (r.ok) cache.put(e.request, r.clone()); return r; }
      catch { return (await cache.match(e.request)) ?? Response.error(); }
    }
    // 셸: 캐시 우선 + 백그라운드 갱신
    const cached = await cache.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => cached);
    return cached || net;
  }));
});
