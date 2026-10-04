"use client";

import { useEffect } from "react";
import { SPLASH_HOLD_SELECTOR } from "@/lib/app-splash";

// Long enough for the logo to land and breathe once, so a fast load still
// reads as an intentional start rather than a flicker.
const MIN_VISIBLE_MS = 900;
// Whatever is still loading by then, show the page (and its own skeletons or
// error) instead of keeping the logo up forever.
const MAX_VISIBLE_MS = 12_000;
const FADE_MS = 300;
const POLL_MS = 100;

// The logo itself is in the server HTML and shown by the inline script in
// layout.tsx (APP_SPLASH_SCRIPT) before first paint, so it is on screen while
// the JS bundle and the database are still loading. This only decides when to
// take it away: once the app has hydrated, the minimum time has passed and
// the server has finished streaming the page.
export function AppSplash() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.splash !== "on") return;

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    const hide = () => {
      clearInterval(poll);
      root.dataset.splash = "leaving";
      fadeTimer = setTimeout(() => {
        root.dataset.splash = "off";
      }, FADE_MS);
    };

    // performance.now() counts from the start of the navigation, so time
    // spent waiting for the server counts towards the minimum.
    const poll = setInterval(() => {
      const elapsed = performance.now();
      const pageStillLoading = document.querySelector(SPLASH_HOLD_SELECTOR) !== null;
      if (elapsed >= MAX_VISIBLE_MS || (elapsed >= MIN_VISIBLE_MS && !pageStillLoading)) hide();
    }, POLL_MS);

    return () => {
      clearInterval(poll);
      clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <div id="app-splash" aria-hidden="true" className="no-print">
      {/* A plain <img> on purpose: the 256px copy is ~5KB and preloaded in
          the head, where next/image would add a round trip to the server
          before the very first thing the user sees. */}
      <div className="app-splash-pop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-splash.png"
          alt=""
          width={112}
          height={112}
          decoding="sync"
          fetchPriority="high"
          className="app-splash-logo dark:invert"
        />
      </div>
    </div>
  );
}
