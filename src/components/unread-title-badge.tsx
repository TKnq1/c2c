"use client";

import { useEffect } from "react";

// Prefixes the browser tab's title with the unread count (e.g. "(3) Requests
// · C2C") so new activity is noticeable even on a background tab. Next.js
// re-renders <title> itself on every navigation — sometimes by replacing
// the element outright rather than just mutating its text — so this reads/
// writes through document.title (always resolves to whatever's current,
// no stale node reference) and watches the whole <head> subtree rather
// than one specific node to catch either kind of change.
//
// Also mirrors the same count onto the installed app's home-screen icon
// via the Badging API, where supported (Chrome/Edge desktop + Android;
// not iOS Safari) — the one piece of this that only does anything once
// someone's actually installed the app, everyone else just gets the title.
export function UnreadTitleBadge({ count }: { count: number }) {
  useEffect(() => {
    const badge = count > 0 ? `(${count > 9 ? "9+" : count}) ` : "";

    const applyBadge = () => {
      const current = document.title;
      const bare = current.replace(/^\(\d+\+?\)\s/, "");
      const next = `${badge}${bare}`;
      if (current !== next) document.title = next;
    };
    applyBadge();

    const observer = new MutationObserver(applyBadge);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    if ("setAppBadge" in navigator) {
      if (count > 0) navigator.setAppBadge(count).catch(() => {});
      else navigator.clearAppBadge?.().catch(() => {});
    }

    return () => observer.disconnect();
  }, [count]);

  return null;
}
