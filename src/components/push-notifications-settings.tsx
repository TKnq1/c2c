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
import { useI18n } from "@/components/i18n-provider";
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
  const { t } = useI18n();
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
        toast.success(t("screens.settings.pushDisabled"));
        return;
      }
      const result = await enableNativePush();
      if (result === "denied") {
        setError(t("screens.settings.pushDeniedPhone"));
        return;
      }
      setSubscribed(true);
      toast.success(t("screens.settings.pushEnabled"));
    } catch {
      setError(t("screens.settings.pushChangeFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <SettingsRow
      label={t("screens.settings.push")}
      hint={error ?? (subscribed ? t("screens.settings.pushOn") : t("screens.settings.pushOffPhone"))}
    >
      <Switch checked={subscribed} onChange={toggle} disabled={pending} label={t("screens.settings.push")} />
    </SettingsRow>
  );
}

// Browsers: Web Push through the service worker.
function WebPushSettings() {
  const { t } = useI18n();
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
        setError(t("screens.settings.pushDeniedBrowser"));
        return;
      }
      setSubscribed(true);
      toast.success(t("screens.settings.pushEnabled"));
    } catch {
      setError(t("screens.settings.pushEnableFailed"));
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
      toast.success(t("screens.settings.pushDisabled"));
    } catch {
      setError(t("screens.settings.pushDisableFailed"));
    } finally {
      setPending(false);
    }
  };

  if (!supported) {
    return (
      <SettingsRow label={t("screens.settings.push")} hint={t("screens.settings.pushUnsupported")} />
    );
  }

  return (
    <SettingsRow
      label={t("screens.settings.push")}
      hint={error ?? (subscribed ? t("screens.settings.pushOn") : t("screens.settings.pushOffDevice"))}
    >
      <Switch
        checked={subscribed}
        onChange={(next) => (next ? subscribe() : unsubscribe())}
        disabled={pending}
        label={t("screens.settings.push")}
      />
    </SettingsRow>
  );
}
