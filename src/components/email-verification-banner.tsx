"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";

const DISMISS_KEY = "email-verification-banner-dismissed";

export function EmailVerificationBanner() {
  const [dismissed, setDismissed] = useState(false);

  useLayoutEffect(() => {
    // Runs before paint so a returning visitor who already dismissed this
    // never sees it flash on screen first (same idiom as ThemeToggle's
    // pre-paint safety net).
    let wasDismissed = false;
    try {
      wasDismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Storage unavailable (private mode etc.) — just show the banner.
    }
    if (wasDismissed) queueMicrotask(() => setDismissed(true));
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore — worst case it reappears on the next page.
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="bg-fog border-b border-ink/10 px-6 py-2 text-sm text-ink no-print">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
        <p className="text-center">
          Your email isn&apos;t verified.{" "}
          <Link href="/dashboard/verify-email" className="underline font-medium">
            Verify now
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-stone hover:text-ink transition"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
