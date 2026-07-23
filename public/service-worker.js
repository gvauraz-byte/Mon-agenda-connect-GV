// Service worker de l'agenda : permet l'installation en app (PWA) et le
// fonctionnement hors-ligne (consultation + mise en file d'attente des
// modifications faites sans connexion, envoyees des que le reseau revient).

const SW_VERSION = 'agenda-v1';
const SHELL_CACHE = SW_VERSION + '-shell';
const API_CACHE = SW_VERSION + '-api';

const SHELL_FILES = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('agenda-') && key !== SHELL_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isApiGet(request) {
  const url = new URL(request.url);
  return request.method === 'GET' && url.pathname.startsWith('/api/');
}

function isShellRequest(request) {
  const url = new URL(request.url);
  return (
    request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // les ecritures passent en direct (gerees cote client)

  if (isShellRequest(request)) {
    // Reseau d'abord (version a jour), repli sur le cache hors-ligne.
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => cached || Response.error())
        )
    );
    return;
  }

  if (isApiGet(request)) {
    // Reseau d'abord, on garde une copie pour la consultation hors-ligne.
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              new Response(JSON.stringify({ error: 'Hors-ligne : donnees non disponibles en cache.' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              })
          )
        )
    );
    return;
  }

  // Fichiers statiques (police, icones, etc.) : cache d'abord, sinon reseau.
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
