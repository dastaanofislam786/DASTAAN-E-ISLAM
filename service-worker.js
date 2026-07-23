const CACHE_NAME = "dastaan-cache-v1.0.7";

const STATIC_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",

  "./css/style.css",
  "./css/animations.css",
  "./css/responsive.css",

  "./js/main.js",
  "./js/quiz.js",
  "./js/pwa.js",
  "./js/ripple.js",

  "./data/seerat_text.json",
  "./data/quiz_questions.json"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );

  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches.keys().then(keys =>

      Promise.all(

        keys.map(key => {

          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

        })

      )

    )

  );

  self.clients.claim();

});

// FETCH
self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") return;

  const request = event.request;

  // HTML pages → Network First
  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request)

        .then(response => {

          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));

          return response;

        })

        .catch(() =>

          caches.match(request)
            .then(r => r || caches.match("./offline.html"))

        )

    );

    return;

  }

  // Images / Audio / CSS / JS / JSON → Cache First
  event.respondWith(

    caches.match(request)

      .then(cacheResponse => {

        if (cacheResponse) {

          return cacheResponse;

        }

        return fetch(request)

          .then(networkResponse => {

            if (!networkResponse || networkResponse.status !== 200) {

              return networkResponse;

            }

            const copy = networkResponse.clone();

            caches.open(CACHE_NAME)

              .then(cache => {

                cache.put(request, copy);

              });

            return networkResponse;

          });

      })

      .catch(() => {

        if (request.destination === "image") {

          return caches.match("./assets/images/LOGO.png");

        }

      })

  );

});