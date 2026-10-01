"use client";

import { useSyncExternalStore } from "react";

// The current time for "5 min ago" labels, shared by every label on the
// page and refreshed every half minute, and right away when the app comes
// back from the background (where iOS pauses timers). Null on the server
// and while hydrating, which can't agree with the browser on "now".
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function tick() {
  now = Date.now();
  listeners.forEach((listener) => listener());
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}

function getSnapshot() {
  if (!now) now = Date.now();
  return now;
}

export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
