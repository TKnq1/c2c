"use client";

import { useEffect, useState, type ReactNode } from "react";

// Much narrower than an earlier attempt at this: only tracks height, never
// touches position/top, no body-scroll-lock, no extra CSS state. The card
// stays in normal document flow — this just keeps its height matched to
// window.visualViewport.height (the actual visible area, which shrinks as
// the on-screen keyboard opens) instead of a static vh/dvh value that
// doesn't know the keyboard exists. The point: if the card never grows
// taller than what's actually visible, the page never has a reason to
// scroll itself to keep the focused input in view — iOS only does that
// when something doesn't already fit.
export function MobileChatHeight({ children, className }: { children: ReactNode; className: string }) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      setHeight(isMobile ? vv.height : null);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  return (
    <div className={className} style={height !== null ? { height: `${height}px` } : undefined}>
      {children}
    </div>
  );
}
