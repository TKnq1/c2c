"use client";

import { useEffect } from "react";

// A link that names a part of a page (/dashboard/deals/abc#drafts, from a notice) lands right when it is followed inside the app, but
// not when the page is opened fresh (a push notification, an e-mail): the server's HTML scrolls the document to the part, then the
// app shell takes over (body.dashboard-shell, set by Nav) and <main> becomes the scroller, which starts at the top again. Once the
// shell is in place this goes to the part again, and gives up as soon as the person scrolls themselves.
export function ScrollToHash() {
  useEffect(() => {
    let id = "";
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    if (!id) return;

    const go = () => {
      const target = document.getElementById(id);
      if (!target) return;
      // A part that is folded away (<details>) opens first: there is nothing to scroll to inside a closed one.
      for (let d = target.closest("details"); d; d = d.parentElement?.closest("details") ?? null) d.open = true;
      target.scrollIntoView({ block: "start" });
    };
    // A few looks while the layout settles: the shell class is set in an effect of Nav, and fonts and images move things a little.
    const timers = [0, 150, 500].map((ms) => window.setTimeout(go, ms));
    const stop = () => {
      timers.forEach(window.clearTimeout);
      cleanup();
    };
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    const cleanup = () => events.forEach((name) => window.removeEventListener(name, stop));
    events.forEach((name) => window.addEventListener(name, stop, { passive: true, once: true }));
    return () => {
      timers.forEach(window.clearTimeout);
      cleanup();
    };
  }, []);
  return null;
}
