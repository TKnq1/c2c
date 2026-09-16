"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Logo is sliced into thirds (roughly one per glyph — C, 2, C) so each can
// pop in independently, left to right, instead of a flat wipe/fade.
const SLICE_DELAYS_MS = [0, 200, 400];
const POP_DURATION_MS = 500;
const HOLD_MS = 1500;
const FADE_MS = 500;
const LOGO_WIDTH = 240;
const LOGO_ASPECT = 1520 / 704; // matches public/logo.png's own crop

export function WelcomeOverlay() {
  const router = useRouter();
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
        router.replace(pathname);
      }, HOLD_MS + FADE_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [show, router, pathname]);

  if (!show || done) return null;

  const logoHeight = LOGO_WIDTH / LOGO_ASPECT;
  const sliceWidth = LOGO_WIDTH / 3;

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-out` }}
    >
      <div role="img" aria-label="C2C" className="flex" style={{ width: LOGO_WIDTH, height: logoHeight }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: sliceWidth,
              height: logoHeight,
              overflow: "hidden",
              position: "relative",
              opacity: 0,
              animationName: "logo-pop",
              animationDuration: `${POP_DURATION_MS}ms`,
              animationDelay: `${SLICE_DELAYS_MS[i]}ms`,
              animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              animationFillMode: "forwards",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              className="dark:invert"
              style={{ position: "absolute", left: -i * sliceWidth, top: 0, width: LOGO_WIDTH, height: logoHeight, maxWidth: "none" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
