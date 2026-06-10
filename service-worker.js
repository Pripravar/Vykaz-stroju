// Service Worker - offline cache pro PWA (app shell).
// Verze cache - při změně index.html zvyš číslo, aby se cache obnovila.
const CACHE = 'desetidenka-v4';

const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = e.request.url;

  // Firebase / Google API požadavky NIKDY necachuj - Firestore má vlastní
  // offline synchronizaci a cache by ji rozbila.
  if(/firestore|googleapis|firebaseio|identitytoolkit|google\.com|gstatic\.com\/firebasejs/.test(url)){
    return; // nech projít přímo na síť
  }

  // App shell: cache-first, ostatní (same-origin) network s fallbackem do cache.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(resp => {
        if(resp && resp.status === 200 && new URL(url).origin === location.origin){
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
