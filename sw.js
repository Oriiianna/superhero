const cacheName = 'SuperHero-v1';
const assets = [
    '/index.html',
    '/niveles.html',
    '/niveles/nivel1.html',
    '/niveles/nivel2.html',
    '/niveles/nivel3.html',
    '/css/style.css',
    '/js/main.js',
    '/js/nivel1.js',
    '/js/nivel2.js',
    '/js/nivel3.js',
    '/icons/icon-192x192.png',
    '/icons/icon-256x256.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    '/manifest.json',
    '/audio/tap.mp3',
    '/audio/victory.mp3',
    '/img/bg-card.jpg',
    '/img/deadpool-seeklogo.svg',
    '/img/deadpool-wallpaper.jpg',
    '/img/favicon.png',
    '/img/ico-facil.svg',
    '/img/ico-medio.svg',
    '/img/ico-dificil.svg',
];

/*Instalar*/
self.addEventListener('install', event => {
    console.log('SW instalado');
    event.waitUntil(
        caches.open(cacheName).then(cache => cache.addAll(assets))
    );
});

/*Activar*/
self.addEventListener('activate', event => {
    console.log('SW activado');
});

/*Cache*/
self.addEventListener('fetch', event => {
    const reqUrl = new URL(event.request.url);

    if (reqUrl.origin === 'https://superheroapi.com') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cacheResponse => {
            if (cacheResponse) return cacheResponse;

            return fetch(event.request.clone())
                .then(networkResponse => {
                    if (!networkResponse || networkResponse.status !== 200 || !event.request.url.startsWith(self.location.origin)) {
                        return networkResponse;
                    }
                    const responseClone = networkResponse.clone();
                    caches.open(cacheName).then(cache => cache.put(event.request, responseClone));
                    return networkResponse;
                })
                .catch(() => {
                    return new Response("Sin conexión y recurso no cacheado", {
                        status: 503,
                        statusText: "Servicio No Disponible"
                    });
                });
        })
    );
});
