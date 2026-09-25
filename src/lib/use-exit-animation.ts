"use client";

import { useEffect, useState } from "react";

// Keeps a menu/dialog rendered through its exit animation after `open`
// flips to false — a plain conditional render removes the node before
// anything could paint. `closing` is the in-between state to hang the exit
// class on; `present` drops once onExitEnd reports the animation finished.
// The fallback timer covers exits that never actually play (reduced motion,
// an element already display:none), which would otherwise leave it stuck.
export function useExitAnimation(open: boolean, fallbackMs = 400) {
  const [present, setPresent] = useState(open);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setPresent(true);
  }
  const closing = present && !open;

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setPresent(false), fallbackMs);
    return () => clearTimeout(timer);
  }, [closing, fallbackMs]);

  const onExitEnd = () => {
    if (!open) setPresent(false);
  };

  return { present, closing, onExitEnd };
}
