"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { savePushSubscriptionAction, deletePushSubscriptionAction } from "@/lib/actions/push";
import { toast } from "@/lib/toast";
import { SettingsRow } from "@/components/settings-section";
import { Switch } from "@/components/switch";
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

const noopSubscribe = () => () => {};

export function PushNotificationsSettings() {
  // Unknown (null) during SSR, since the server can't tell a store app from
  // a browser here, and settled on the client right after hydration.
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

  const toggle = async (next: boolean) => {
    setError(undefined);
    setPending(true);
    try {
      if (!next) {
        await disableNativePush();
        setSubscribed(false);
        toast.success("Push notifications disabled.");
        return;
      }
      const result = await enableNativePush();
      if (result === "denied") {
        setError("Notifications are off for comtor. Turn them on in your phone's Settings app, then try again.");
        return;
      }
      setSubscribed(true);
      toast.success("Push notifications enabled.");
    } catch {
      setError("Couldn't change push notifications. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <SettingsRow
      label="Push notifications"
      hint={error ?? (subscribed ? "On for this device." : "Get notified on this phone about new messages and payments.")}
    >
      <Switch checked={subscribed} onChange={toggle} disabled={pending} label="Push notifications" />
    </SettingsRow>
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
    setError(undefined);
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
    } catch {
      setError("Couldn't turn push notifications off. Try again.");
    } finally {
      setPending(false);
    }
  };

  if (!supported) {
    return (
      <SettingsRow label="Push notifications" hint="Not supported in this browser. Add comtor to your home screen to get them." />
    );
  }

  return (
    <SettingsRow
      label="Push notifications"
      hint={error ?? (subscribed ? "On for this device." : "Get notified on this device, even when the app is closed.")}
    >
      <Switch
        checked={subscribed}
        onChange={(next) => (next ? subscribe() : unsubscribe())}
        disabled={pending}
        label="Push notifications"
      />
    </SettingsRow>
  );
}
