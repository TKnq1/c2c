"use client";

import { useEffect, type ReactNode } from "react";

// The real, complete fix for iOS Safari's keyboard: Safari doesn't support
// interactive-widget, and unlike Android it *shifts* the visual viewport
// (scrolls it down) rather than shrinking the layout viewport, so a fixed
// element anchored with plain `top: 0` drifts out of sync with what's
// actually visible. window.visualViewport reports both the true height
// AND that shift (offsetTop) in real time — exposing both as CSS custom
// properties (rather than just setting inline height, as an earlier
// version of this did) lets every element that cares (the frame's own
// position/height, the input bar's safe-area padding) react via plain
// CSS instead of each needing its own JS. 100px keyboardHeight threshold
// avoids false positives from browser chrome (address bar) showing/hiding.
export function MobileChatFrame({ children, className }: { children: ReactNode; className: string }) {
  useEffect(() => {
    const vv = window.visualViewport;
    const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

    const sync = () => {
      if (!vv || !isMobile()) {
        document.documentElement.style.removeProperty("--vvh");
        document.documentElement.style.removeProperty("--vv-top");
        document.documentElement.style.removeProperty("--kb");
        document.documentElement.classList.remove("keyboard-open");
        return;
      }
      const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
      document.documentElement.style.setProperty("--vv-top", `${vv.offsetTop}px`);
      document.documentElement.style.setProperty("--kb", `${keyboardHeight}px`);
      document.documentElement.classList.toggle("keyboard-open", keyboardHeight > 100);
    };
    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);

    // Locks the page behind this full-screen view to its current scroll
    // position for as long as it's mounted — plain `overflow: hidden` on
    // body doesn't reliably stop touch-drag scrolling on iOS, but a fixed
    // body pinned to the negative scroll offset does, and restoring
    // scrollY on cleanup makes it invisible that this ever happened.
    let restoreBodyScroll: (() => void) | undefined;
    if (isMobile()) {
      const scrollY = window.scrollY;
      const prev = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width };
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      restoreBodyScroll = () => {
        document.body.style.position = prev.position;
        document.body.style.top = prev.top;
        document.body.style.width = prev.width;
        window.scrollTo(0, scrollY);
      };
    }

    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.documentElement.style.removeProperty("--vvh");
      document.documentElement.style.removeProperty("--vv-top");
      document.documentElement.style.removeProperty("--kb");
      document.documentElement.classList.remove("keyboard-open");
      restoreBodyScroll?.();
    };
  }, []);

  return <div className={className}>{children}</div>;
}
