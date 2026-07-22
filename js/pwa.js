// ===============================
// DASTAAN-E-ISLAM
// PWA Engine v1.0.4
// ===============================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", async () => {

        try {

            const registration = await navigator.serviceWorker.register("./service-worker.js");

            console.log("✅ Service Worker Registered");

            // Check for updates every time app opens
            registration.update();

            // Reload automatically after new Service Worker activates
            navigator.serviceWorker.addEventListener("controllerchange", () => {

                console.log("🔄 New version activated");

                window.location.reload();

            });

        } catch (error) {

            console.error("❌ Service Worker Failed", error);

        }

    });

}