"use client";

import { useEffect } from "react";

// A focused field with the visible area this much shorter than the window
// means the on-screen keyboard is up (smaller gaps are browser bars).
const KEYBOARD_MIN_PX = 100;

function isTextField(el: Element | null) {
  return !!el?.matches("input, textarea, [contenteditable='true']");
}

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
// the full-height layout, slides it up under the keyboard, and lets the
// whole thing be dragged around: header, messages and composer together.
// So on phones the chat thread is pinned to the *visual* viewport instead
// (see .chat-thread in globals.css) — exactly the part of the screen the
// keyboard leaves free, tracked here on every resize and every shift iOS
// makes. While the keyboard is up, drags that don't land on something
// scrollable are cancelled, so the page itself can't be pulled around.
export function ChatViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;

    const sync = () => {
      root.style.setProperty("--vvh", `${vv.height}px`);
      root.style.setProperty("--vv-top", `${vv.offsetTop}px`);
      root.classList.toggle(
        "keyboard-open",
        isTextField(document.activeElement) && window.innerHeight - vv.height > KEYBOARD_MIN_PX,
      );
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!root.classList.contains("keyboard-open") || inScrollableArea(e.target)) return;
      e.preventDefault();
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", sync);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", sync);
      document.removeEventListener("touchmove", onTouchMove);
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vv-top");
      root.classList.remove("keyboard-open");
    };
  }, []);

  return null;
}
