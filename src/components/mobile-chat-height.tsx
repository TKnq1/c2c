"use client";

import { useEffect, useState, type ReactNode } from "react";

// Keeps the message list's available height matched to
// window.visualViewport.height (shrinks as the keyboard opens) instead of a
// static vh/dvh value that doesn't know the keyboard exists — otherwise the
// list itself would overflow into/under the keyboard. Also sets --kb (the
// keyboard's own height) as a CSS custom property on <html>, which
// ChatInputBar reads to transform itself up above the keyboard: fixed
// positioning is what actually keeps an element pinned above the keyboard
// on iOS (a resized container alone isn't enough — the input needs to be
// out of normal flow entirely, immune to any scroll on the page around it).
export function MobileChatHeight({ children, className }: { children: ReactNode; className: string }) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      setHeight(isMobile ? vv.height : null);
      const keyboardHeight = isMobile ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
      document.documentElement.style.setProperty("--kb", `${keyboardHeight}px`);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      document.documentElement.style.removeProperty("--kb");
    };
  }, []);

  return (
    <div className={className} style={height !== null ? { height: `${height}px` } : undefined}>
      {children}
    </div>
  );
}
