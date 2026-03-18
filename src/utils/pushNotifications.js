const VAPID_PUBLIC_KEY = "BLo4h6gvmAqQe4hI_weydFNxv24ZAJiDG-pyPFzJXZM0ZtbOisW-1Ump1UyrPSmYteWUelHj2QFUPcnOZ09Z8Sg";

/* Convert VAPID key to Uint8Array */
function urlBase64ToUint8Array(base64String) {

  const padding = "=".repeat((4 - base64String.length % 4) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}


/* Subscribe user for push notifications */
export async function subscribeUser() {

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    alert("Notification permission denied");
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  console.log("Subscription:", subscription);

  await fetch("https://vnbmlkd2-5000.inc1.devtunnels.ms/api/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
      "Content-Type": "application/json"
    }
  });

  alert("Subscribed for notifications!");

}