"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Phase = "idle" | "loading" | "done";

// The App Router has no first-party "navigation started" event, so this
// uses the same technique most community top-loading-bar implementations
// rely on: patching history.pushState (which <Link> and router.push() call
// for every real page transition) to know when one begins, then watching
// the resolved path to know when it ends. Only pushState is patched, not
// replaceState — same-page state synced into the URL (e.g. Discover
// filters, via router.replace) deliberately avoids pushState already, so
// this naturally only fires for genuine page-to-page navigation.
export function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const originalPushState = history.pushState;
    history.pushState = function (...args: Parameters<History["pushState"]>) {
      // Small delay avoids a flash on navigations that resolve instantly.
      showTimer.current = setTimeout(() => setPhase("loading"), 100);
      return originalPushState.apply(history, args);
    };
    return () => {
      history.pushState = originalPushState;
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (showTimer.current) clearTimeout(showTimer.current);
    setPhase((p) => (p === "idle" ? "idle" : "done"));
    const timer = setTimeout(() => setPhase("idle"), 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 z-[100] h-0.5 bg-ink origin-left no-print ${
        phase === "loading"
          ? "scale-x-[0.8] opacity-100 transition-transform duration-[4000ms] ease-out"
          : "scale-x-100 opacity-0 transition-all duration-150 ease-out"
      }`}
    />
  );
}
