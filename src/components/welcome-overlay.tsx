"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

const POP_DURATION_MS = 600;
const HOLD_MS = 1500;
const FADE_MS = 500;
const LOGO_SIZE = 240;
// If the logo somehow hasn't loaded by then, pop it anyway rather than
// hold an empty screen.
const LOAD_TIMEOUT_MS = 700;

export function WelcomeOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const show = searchParams.get("welcome") === "1";

  // The pop only starts once the logo is decoded. Started straight away,
  // it played on an empty box while a full-size PNG was still loading, and
  // the logo then jumped in partway through.
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!show) return;
    const fallback = setTimeout(() => setReady(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(fallback);
  }, [show]);

  useEffect(() => {
    if (!show || !ready) return;
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
  }, [show, ready, pathname]);

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
          willChange: "transform, opacity",
          animation: ready ? `logo-pop ${POP_DURATION_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards` : undefined,
        }}
      >
        {/* next/image, like the Logo everywhere else: a downsized copy
            instead of the 2000×2000 source, which took a moment to decode
            on a phone. */}
        <Image
          src="/logo.png"
          alt="comtor"
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          priority
          className="dark:invert"
          onLoad={(e) => {
            const img = e.currentTarget;
            // Decoded, not just downloaded, before the first frame moves.
            img.decode().then(() => setReady(true), () => setReady(true));
          }}
        />
      </div>
    </div>
  );
}

// On the page that leads to the overlay (login): loads the same
// downsized logo out of sight, so it's already cached when the dashboard
// opens and the pop starts at once.
export function WelcomeLogoPreload() {
  return <Image src="/logo.png" alt="" aria-hidden="true" width={LOGO_SIZE} height={LOGO_SIZE} loading="eager" className="hidden" />;
}
