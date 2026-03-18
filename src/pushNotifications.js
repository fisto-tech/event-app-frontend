export async function registerServiceWorker() {

  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  console.log("Service Worker Registered:", registration);

}