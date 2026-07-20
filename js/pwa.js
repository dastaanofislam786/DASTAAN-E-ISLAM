// ===============================
// PWA - Service Worker Registration
// Version 1.0.1
// ===============================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./service-worker.js")

            .then((registration) => {

                console.log("✅ Service Worker Registered");

            })

            .catch((error) => {

                console.log("❌ Service Worker Failed", error);

            });

    });

}