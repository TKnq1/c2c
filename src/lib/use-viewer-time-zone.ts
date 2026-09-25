"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_TIME_ZONE } from "@/lib/format";

const subscribe = () => () => {};
const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getServerTimeZone = () => DEFAULT_TIME_ZONE;

// Server HTML can't know the viewer's zone, so it renders in the app's
// default; the browser's own zone takes over right after hydration.
// useSyncExternalStore, not an effect + state, is what lets the two differ
// without a hydration mismatch — React hydrates with the server value, then
// re-renders with the client one.
export function useViewerTimeZone(): string {
  return useSyncExternalStore(subscribe, getBrowserTimeZone, getServerTimeZone);
}
