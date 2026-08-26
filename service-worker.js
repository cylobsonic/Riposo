const CACHE_NAME = "riposo-v0.3.4";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];


// ---------------------------------------------------------
// INSTALLAZIONE
// ---------------------------------------------------------

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(CACHE_NAME)
        .then(cache => {

          return cache.addAll(
            FILES_TO_CACHE
          );

        })

    );

    self.skipWaiting();
  }
);


// ---------------------------------------------------------
// ATTIVAZIONE
// ---------------------------------------------------------

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches.keys()
        .then(cacheNames => {

          return Promise.all(

            cacheNames
              .filter(
                name =>
                  name !== CACHE_NAME
              )
              .map(
                name =>
                  caches.delete(name)
              )

          );

        })

    );

    self.clients.claim();
  }
);


// ---------------------------------------------------------
// RICHIESTE
// ---------------------------------------------------------

self.addEventListener(
  "fetch",
  event => {

    event.respondWith(

      caches.match(
        event.request
      )
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(
          event.request
        );

      })

    );
  }
);
