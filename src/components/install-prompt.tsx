"use client";

import { useLayoutEffect, useState } from "react";
import { FiX } from "react-icons/fi";

const DISMISS_KEY = "install-prompt-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Chrome/Android can prompt programmatically (beforeinstallprompt); iOS
// Safari has no such API at all, so that half is just an instruction. Also
// registers the service worker eagerly here (idempotent — safe alongside
// the push-notification settings page's own registration of the same
// /sw.js) since Chrome's install criteria and the offline fallback in
// sw.js both need it active before someone would ever see this banner.
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useLayoutEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline fallback / install prompt just won't be as reliable — not worth surfacing.
      });
    }

    // Same pre-paint idiom as EmailVerificationBanner — a returning visitor
    // who already dismissed this, or who's already running the installed
    // app, never sees it flash on screen first.
    if (isStandalone()) return;
    let wasDismissed = false;
    try {
      wasDismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Storage unavailable — just show it.
    }
    if (wasDismissed) return;

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      queueMicrotask(() => {
        setIsIOS(true);
        setVisible(true);
      });
      return;
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore — worst case it reappears next visit.
    }
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-fog border-b border-ink/10 px-6 py-2 text-sm text-ink no-print">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
        <p className="text-center">
          {isIOS ? (
            <>
              Install C2C: tap Share, then <strong className="font-semibold">Add to Home Screen</strong>.
            </>
          ) : (
            "Install C2C for quicker access and a full-screen view."
          )}
        </p>
        {!isIOS && (
          <button type="button" onClick={install} className="shrink-0 underline font-medium">
            Install
          </button>
        )}
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
