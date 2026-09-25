"use client";

import { useEffect } from "react";
import { isTextField, resetPageScroll } from "@/lib/keyboard";

// A focused field with the visible area this much shorter than the page
// means the on-screen keyboard is up (smaller gaps are browser bars).
const KEYBOARD_MIN_PX = 100;

// Whether this touch should be left to the browser: it's inside something
// that can actually scroll (the message list, a long draft), so it's that
// being scrolled — not the page.
function inScrollableArea(target: EventTarget | null) {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.body) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) return true;
    el = el.parentElement;
  }
  return false;
}

// iOS Safari doesn't shrink the page when the keyboard opens — the
// interactive-widget setting in layout.tsx only reaches Android. It keeps
// the full-height page and scrolls it up so the focused field clears the
// keyboard, which for a chat leaves the composer floating high up with
// blank space under it, creeping down a little with every tap after.
// Instead, while a chat is open the page is sized to exactly the visible
// area (see .dashboard-shell:has(.chat-thread) in globals.css) — the whole
// screen normally, just the part above the keyboard while typing — and the
// scroll iOS adds is put straight back, so the composer ends right on top
// of the keyboard and only the messages scroll. The thread stays in the
// normal page flow rather than position: fixed, which Safari leaves out of
// the page's slide-in view transition. While the keyboard is up, drags
// that don't land on something scrollable are cancelled, so the page
// itself can't be pulled around either.
export function ChatViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;

    const sync = () => {
      resetPageScroll();
      root.style.setProperty("--vvh", `${vv.height}px`);
      // Nonzero only if iOS panned the visible area itself rather than
      // scrolling the page — then the page follows it down instead.
      root.style.setProperty("--vv-top", `${vv.offsetTop}px`);
      const pageHeight = Math.max(window.innerHeight, root.clientHeight);
      root.classList.toggle(
        "keyboard-open",
        isTextField(document.activeElement) && pageHeight - vv.height > KEYBOARD_MIN_PX,
      );
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!root.classList.contains("keyboard-open") || inScrollableArea(e.target)) return;
      e.preventDefault();
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("scroll", sync);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("scroll", sync);
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
      document.removeEventListener("touchmove", onTouchMove);
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vv-top");
      root.classList.remove("keyboard-open");
      resetPageScroll();
    };
  }, []);

  return null;
}
