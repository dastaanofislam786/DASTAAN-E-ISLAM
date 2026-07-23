// ==========================================
// DASTAAN-E-ISLAM
// PWA Engine v2.0
// ==========================================

let deferredPrompt = null;

// -----------------------------
// Register Service Worker
// -----------------------------
if ("serviceWorker" in navigator) {

window.addEventListener("load", async () => {

try{

const registration =
await navigator.serviceWorker.register("./service-worker.js");

console.log("✅ Service Worker Registered");

// Update check
registration.update();

// New version installed
registration.addEventListener("updatefound",()=>{

const installing=registration.installing;

installing.addEventListener("statechange",()=>{

if(
installing.state==="installed" &&
navigator.serviceWorker.controller
){

if(typeof showToast==="function"){
showToast("🚀 New version available");
}

}

});

});

// Auto reload
navigator.serviceWorker.addEventListener(
"controllerchange",
()=>{

window.location.reload();

});

}catch(err){

console.error(err);

}

});

}



// -----------------------------
// Online
// -----------------------------
window.addEventListener("online",()=>{

if(typeof showToast==="function"){
showToast("✅ Connection Restored");
}

});

// -----------------------------
// Offline
// -----------------------------
window.addEventListener("offline",()=>{

if(typeof showToast==="function"){
showToast("📡 You are Offline");
}

});

// -----------------------------
// Install Prompt
// -----------------------------
window.addEventListener(
"beforeinstallprompt",
(e)=>{

e.preventDefault();

deferredPrompt=e;

console.log("Install Available");

});


// Manual Install
async function installApp(){

if(!deferredPrompt)return;

deferredPrompt.prompt();

await deferredPrompt.userChoice;

deferredPrompt=null;

}


// Installed
window.addEventListener("appinstalled",()=>{

if(typeof showToast==="function"){
showToast("🎉 App Installed Successfully");
}

deferredPrompt=null;

});