import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { deleteNativePushTokenAction, saveNativePushTokenAction } from "@/lib/actions/push";
import type { NativePlatformName } from "@/lib/native-app";

// Client-only helpers for push in the Capacitor store apps. In a normal
// browser isNativeApp() is false and nothing here touches the native bridge.

const TOKEN_STORAGE_KEY = "c2c-native-push-token";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function currentNativePlatform(): NativePlatformName | null {
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android" ? platform : null;
}

export function getStoredNativeToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeNativeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage blocked — the server copy of the token still works, only
    // unregistering from this device on logout is lost.
  }
}

// Sends a freshly issued device token to the server for the signed-in user.
// Throws if nobody is signed in (e.g. on /login) — callers decide whether
// that matters.
export async function saveNativeToken(token: string) {
  const platform = currentNativePlatform();
  if (!platform) return;
  storeNativeToken(token);
  await saveNativePushTokenAction({ token, platform });
}

export async function nativePushPermission() {
  const { receive } = await PushNotifications.checkPermissions();
  return receive;
}

// Asks for permission if it hasn't been decided yet, then registers with
// APNs/FCM and resolves once the token has been saved on the server.
export async function enableNativePush(): Promise<"granted" | "denied"> {
  let { receive } = await PushNotifications.checkPermissions();
  if (receive === "prompt" || receive === "prompt-with-rationale") {
    ({ receive } = await PushNotifications.requestPermissions());
  }
  if (receive !== "granted") return "denied";

  const token = await new Promise<string>((resolve, reject) => {
    const handles = [
      PushNotifications.addListener("registration", ({ value }) => {
        handles.forEach((h) => h.then((l) => l.remove()));
        resolve(value);
      }),
      PushNotifications.addListener("registrationError", ({ error }) => {
        handles.forEach((h) => h.then((l) => l.remove()));
        reject(new Error(error));
      }),
    ];
    PushNotifications.register().catch(reject);
  });

  await saveNativeToken(token);
  return "granted";
}

// Removes this device's token from the current account and stops APNs/FCM
// delivery to it. Used by the settings toggle and on logout.
export async function disableNativePush() {
  const token = getStoredNativeToken();
  if (token) await deleteNativePushTokenAction(token).catch(() => {});
  storeNativeToken(null);
  await PushNotifications.unregister().catch(() => {});
}
