"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Whether this page load has navigated within the app yet — so a "Back"
// button knows router.back() stays inside comtor, instead of leaving for
// wherever the tab was before (or nowhere, on a fresh load). Module state:
// it lives exactly as long as the app does, and a reload resets it.
let navigatedInApp = false;

export function hasNavigatedInApp() {
  return navigatedInApp;
}

// Mounted once in the root layout.
export function InAppNavigationMarker() {
  const pathname = usePathname();
  const first = useRef(pathname);
  useEffect(() => {
    if (pathname !== first.current) navigatedInApp = true;
  }, [pathname]);
  return null;
}
