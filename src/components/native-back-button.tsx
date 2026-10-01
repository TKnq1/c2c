"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Android's back button/gesture in the store app: steps back through the
// page history like a browser, and on the first page sends the app to the
// background the way Android apps do. Without a listener the App plugin
// would only ever go back, so back on the first page did nothing.
export function NativeBackButton() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.minimizeApp();
    });

    // Rejects on an installed build without the App plugin (the web code is
    // loaded live and can be newer than the build); back then falls back to
    // the system default.
    listener.catch(() => {});

    return () => {
      listener.then((l) => l.remove()).catch(() => {});
    };
  }, []);

  return null;
}
