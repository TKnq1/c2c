"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { mightBeNativeApp } from "@/lib/native-app";

// The Capacitor plugins are fetched only inside the store apps (see mightBeNativeApp): the website
// doesn't carry them.
const loadNative = () => Promise.all([import("@capacitor/push-notifications"), import("@/lib/native-push-client")]);

// Mounted once in the root layout. Only does anything inside the Capacitor
// store apps:
// - opens the notification's link when one is tapped,
// - re-registers on the first dashboard visit of each app launch when push
//   is already allowed, so a rotated token or a different signed-in account
//   is picked up without the user having to toggle anything.
export function NativePushBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const registeredThisLaunch = useRef(false);

  useEffect(() => {
    if (!mightBeNativeApp()) return;

    let cancelled = false;
    let removeListeners = () => {};

    loadNative()
      .then(([{ PushNotifications }, { isNativeApp, saveNativeToken }]) => {
        if (cancelled || !isNativeApp()) return;

        const listeners = [
          PushNotifications.addListener("registration", ({ value }) => {
            saveNativeToken(value).catch(() => {
              // Not signed in yet — the next dashboard visit registers again.
            });
          }),
          PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
            const url = notification.data?.url;
            // App paths only; "//host" would be another site.
            if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) router.push(url);
          }),
        ];

        // The web code is loaded live and can be newer than the installed app
        // build. If that build lacks the plugin, push simply stays off.
        listeners.forEach((l) => l.catch(() => {}));
        removeListeners = () => listeners.forEach((l) => l.then((h) => h.remove()).catch(() => {}));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      removeListeners();
    };
  }, [router]);

  useEffect(() => {
    if (!mightBeNativeApp() || registeredThisLaunch.current || !pathname.startsWith("/dashboard")) return;
    registeredThisLaunch.current = true;

    loadNative()
      .then(async ([{ PushNotifications }, { isNativeApp, nativePushPermission }]) => {
        if (!isNativeApp()) return;
        if ((await nativePushPermission()) === "granted") await PushNotifications.register();
      })
      .catch(() => {});
  }, [pathname]);

  return null;
}
