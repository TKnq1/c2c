"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { savePushSubscriptionAction, deletePushSubscriptionAction } from "@/lib/actions/push";
import { toast } from "@/lib/toast";
import {
  disableNativePush,
  enableNativePush,
  getStoredNativeToken,
  isNativeApp,
  nativePushPermission,
} from "@/lib/native-push-client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const TOGGLE_BUTTON_CLASS =
  "rounded border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition disabled:opacity-50 shrink-0 dark:border-neutral-700 dark:hover:bg-neutral-800/50";

const noopSubscribe = () => () => {};

export function PushNotificationsSettings() {
  // Unknown (null) during SSR — the server can't tell a store app from a
  // browser here — and settled on the client right after hydration.
  const native = useSyncExternalStore<boolean | null>(noopSubscribe, isNativeApp, () => null);

  if (native === null) return null;
  return native ? <NativePushSettings /> : <WebPushSettings />;
}

// Store apps: APNs/FCM through @capacitor/push-notifications.
function NativePushSettings() {
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    nativePushPermission()
      .then((permission) => setSubscribed(permission === "granted" && !!getStoredNativeToken()))
      .catch(() => {});
  }, []);

  const toggle = async () => {
    setError(undefined);
    setPending(true);
    try {
      if (subscribed) {
        await disableNativePush();
        setSubscribed(false);
        toast.success("Push notifications disabled.");
        return;
      }
      const result = await enableNativePush();
      if (result === "denied") {
        setError("Notifications are turned off for C2C. Turn them on in your phone's Settings app, then try again.");
        return;
      }
      setSubscribed(true);
      toast.success("Push notifications enabled.");
    } catch {
      setError("Couldn't enable push notifications.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {subscribed ? "Enabled on this device." : "Get notified on this phone about new messages and payments."}
        </p>
        <button type="button" onClick={toggle} disabled={pending} className={TOGGLE_BUTTON_CLASS}>
          {pending ? "…" : subscribed ? "Disable" : "Enable"}
        </button>
      </div>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}

// Browsers: Web Push through the service worker.
function WebPushSettings() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setSupported(true);
      setSubscribed(!!existing);
    });
  }, []);

  const subscribe = async () => {
    setError(undefined);
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications were blocked. Enable them in your browser's site settings to turn this on.");
        return;
      }
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
      setSubscribed(true);
      toast.success("Push notifications enabled.");
    } catch {
      setError("Couldn't enable push notifications.");
    } finally {
      setPending(false);
    }
  };

  const unsubscribe = async () => {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Push notifications disabled.");
    } finally {
      setPending(false);
    }
  };

  if (!supported) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">Push notifications aren&apos;t supported in this browser.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {subscribed ? "Enabled for this browser." : "Get notified here even when the tab is closed."}
        </p>
        <button
          type="button"
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={pending}
          className={TOGGLE_BUTTON_CLASS}
        >
          {pending ? "…" : subscribed ? "Disable" : "Enable"}
        </button>
      </div>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
