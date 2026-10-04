import { deletePushSubscriptionAction, savePushSubscriptionAction } from "@/lib/actions/push";

// Browser Web Push (VAPID) from the client, shared by the Settings toggle
// and the onboarding's notification step. The store apps use
// native-push-client.ts instead.

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function browserSupportsWebPush() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// Registers the service worker (idempotent) and returns this browser's
// current subscription, if any.
export async function currentWebPushSubscription() {
  const registration = await navigator.serviceWorker.register("/sw.js");
  return registration.pushManager.getSubscription();
}

// Asks for permission if needed, subscribes and saves the subscription for
// the signed-in account. "denied" when the person said no (or already had).
export async function enableWebPush(): Promise<"granted" | "denied"> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""),
  });
  const json = subscription.toJSON();
  await savePushSubscriptionAction({
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh!,
    auth: json.keys!.auth!,
  });
  return "granted";
}

export async function disableWebPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await deletePushSubscriptionAction(subscription.endpoint);
    await subscription.unsubscribe();
  }
}
