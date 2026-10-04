"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  browserSupportsWebPush,
  currentWebPushSubscription,
  disableWebPush,
  enableWebPush,
} from "@/lib/web-push-client";
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
    if (!browserSupportsWebPush()) return;
    currentWebPushSubscription().then((existing) => {
      setSupported(true);
      setSubscribed(!!existing);
    });
  }, []);

  const subscribe = async () => {
    setError(undefined);
    setPending(true);
    try {
      if ((await enableWebPush()) === "denied") {
        setError("Notifications were blocked. Enable them in your browser's site settings to turn this on.");
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

  const unsubscribe = async () => {
    setError(undefined);
    setPending(true);
    try {
      await disableWebPush();
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
