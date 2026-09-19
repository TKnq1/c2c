"use client";

import { useEffect } from "react";

// Prefixes the browser tab's title with the unread count (e.g. "(3) Requests
// · C2C") so new activity is noticeable even on a background tab. Next.js
// re-renders <title> itself on every navigation — sometimes by replacing
// the element outright rather than just mutating its text — so this reads/
// writes through document.title (always resolves to whatever's current,
// no stale node reference) and watches the whole <head> subtree rather
// than one specific node to catch either kind of change.
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
    return () => observer.disconnect();
  }, [count]);

  return null;
}
