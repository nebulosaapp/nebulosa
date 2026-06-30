const CACHE_NAME = 'nebulosa-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/home.html',
  '/login.html',
  '/index.html',
  '/perfil.html',
  '/biblioteca.html',
  '/configuracao.html',
  '/test.html',
  '/results.html',
  '/relacional-test.html',
  '/relacional-results.html',
  '/assets/style.css',
  '/assets/i18n.js',
  '/assets/menu.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

// Instalar Service Worker e colocar assets em cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Cache: Cache First para Assets estáticos, Network First para APIs e páginas dinâmicas
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // APIs e chamadas AJAX de dados dinâmicos rodam sob Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Assets locais estáticos rodam sob Cache First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Busca atualização em background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
