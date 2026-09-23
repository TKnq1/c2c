"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const POP_DURATION_MS = 500;
const HOLD_MS = 1500;
const FADE_MS = 500;
const LOGO_SIZE = 240;

export function WelcomeOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const show = searchParams.get("welcome") === "1";

  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!show) return;

    const timers = [
      setTimeout(() => setFading(true), HOLD_MS),
      setTimeout(() => {
        setDone(true);
        // Not router.replace: this route is fully dynamic, so that would
        // re-run the whole dashboard layout/page just to drop `?welcome=1`
        // — right as someone's first landing on their dashboard. Dropping
        // the param is purely cosmetic (nothing reads it after this point),
        // so a plain history update is all it needs.
        window.history.replaceState(null, "", pathname);
      }, HOLD_MS + FADE_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [show, pathname]);

  if (!show || done) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-out` }}
    >
      <div
        style={{
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          opacity: 0,
          animationName: "logo-pop",
          animationDuration: `${POP_DURATION_MS}ms`,
          animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          animationFillMode: "forwards",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="C2C" className="dark:invert" style={{ width: LOGO_SIZE, height: LOGO_SIZE }} />
      </div>
    </div>
  );
}
