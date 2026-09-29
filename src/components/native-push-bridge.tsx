"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PushNotifications } from "@capacitor/push-notifications";
import { isNativeApp, nativePushPermission, saveNativeToken } from "@/lib/native-push-client";

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
    if (!isNativeApp()) return;

    const listeners = [
      PushNotifications.addListener("registration", ({ value }) => {
        saveNativeToken(value).catch(() => {
          // Not signed in yet — the next dashboard visit registers again.
        });
      }),
      PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
        const url = notification.data?.url;
        if (typeof url === "string" && url.startsWith("/")) router.push(url);
      }),
    ];

    return () => {
      listeners.forEach((l) => l.then((h) => h.remove()));
    };
  }, [router]);

  useEffect(() => {
    if (!isNativeApp() || registeredThisLaunch.current || !pathname.startsWith("/dashboard")) return;
    registeredThisLaunch.current = true;

    nativePushPermission()
      .then((permission) => {
        if (permission === "granted") return PushNotifications.register();
      })
      .catch(() => {});
  }, [pathname]);

  return null;
}
