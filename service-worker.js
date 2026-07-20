const CACHE_NAME = "dastaan-cache-v1.0.2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",

  "./css/style.css",
  "./css/animations.css",
  "./css/responsive.css",

  "./js/main.js",
  "./js/quiz.js",

  "./data/seerat_text.json",
  "./data/quiz_questions.json"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// Smart Fetch (Version 1.0.2)

self.addEventListener("fetch", (event) => {

    if (event.request.method !== "GET") return;

    event.respondWith(

        caches.match(event.request).then((cachedResponse) => {

            if (cachedResponse) {

                return cachedResponse;

            }

            return fetch(event.request)

                .then((networkResponse) => {

                    if (!networkResponse || networkResponse.status !== 200) {

                        return networkResponse;

                    }

                    const responseClone = networkResponse.clone();

                    caches.open(CACHE_NAME)

                        .then((cache) => {

                            cache.put(event.request, responseClone);

                        });

                    return networkResponse;

                })



             .catch(() => {

    if (event.request.mode === "navigate") {
        return caches.match("./offline.html");
    }

    return Response.error();

});

        })

    );

});