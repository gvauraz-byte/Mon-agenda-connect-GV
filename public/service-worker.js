// Service worker de l'agenda : permet l'installation en app (PWA) et le
// fonctionnement hors-ligne (consultation + mise en file d'attente des
// modifications faites sans connexion, envoyees des que le reseau revient).

const SW_VERSION = 'agenda-v2';
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

// Ne remplace le shell en cache que par une reponse qui contient vraiment
// l'application : la page d'attente de Render est du HTML valide, elle aussi.
async function rafraichirShell(request) {
  try {
    const res = await fetch(request);
    if (!res || !res.ok) return;
    const type = res.headers.get('content-type') || '';
    if (!type.includes('text/html')) return;
    const texte = await res.clone().text();
    if (!texte.includes('id="cal"')) return; // ce n'est pas notre page
    const cache = await caches.open(SHELL_CACHE);
    await cache.put('/index.html', res);
  } catch (err) {
    // Hors-ligne ou serveur endormi : on garde ce qu'on a.
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // les ecritures passent en direct (gerees cote client)

  if (isShellRequest(request)) {
    // Cache d'abord, rafraichi en arriere-plan.
    //
    // Pourquoi pas le reseau d'abord : l'instance Render s'endort apres une
    // quinzaine de minutes sans visite. Au reveil, c'est RENDER qui repond a
    // notre place, avec sa page noire "SERVICE WAKING UP", pendant trente a
    // soixante secondes. Comme c'est une reponse valide, le reseau d'abord la
    // servait telle quelle -- et pire, la mettait en cache a la place de
    // l'application. On sert donc immediatement la derniere version connue,
    // et on ne remplace le shell que par une page qui est bien la notre.
    event.respondWith(
      caches.match('/index.html').then((cached) => cached || fetch(request))
    );
    event.waitUntil(rafraichirShell(request));
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
