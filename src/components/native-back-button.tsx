"use client";

import { useEffect } from "react";
import { mightBeNativeApp } from "@/lib/native-app";

// Android's back button/gesture in the store app: steps back through the
// page history like a browser, and on the first page sends the app to the
// background the way Android apps do. Without a listener the App plugin
// would only ever go back, so back on the first page did nothing.
// The Capacitor plugins are fetched only inside the store apps (see mightBeNativeApp).
export function NativeBackButton() {
  useEffect(() => {
    if (!mightBeNativeApp()) return;

    let cancelled = false;
    let removeListener = () => {};

    Promise.all([import("@capacitor/app"), import("@capacitor/core")])
      .then(([{ App }, { Capacitor }]) => {
        if (cancelled || Capacitor.getPlatform() !== "android") return;

        const listener = App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) window.history.back();
          else App.minimizeApp();
        });

        // Rejects on an installed build without the App plugin (the web code is
        // loaded live and can be newer than the build); back then falls back to
        // the system default.
        listener.catch(() => {});
        removeListener = () => {
          listener.then((l) => l.remove()).catch(() => {});
        };
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      removeListener();
    };
  }, []);

  return null;
}
