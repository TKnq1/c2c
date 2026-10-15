"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FiX } from "react-icons/fi";
import { Capacitor } from "@capacitor/core";
import { useI18n } from "@/components/i18n-provider";

const DISMISS_KEY = "install-prompt-dismissed";
const VISITS_KEY = "install-prompt-visits";
const COUNTED_KEY = "install-prompt-counted";
// Not on the first visit: someone who just signed up has other things to do first.
const MIN_VISITS = 2;
// Only on the home screens, not above every page someone is working on.
const HOME_PATHS = new Set(["/dashboard", "/dashboard/startup", "/dashboard/creator"]);

// Visits are counted per browser session (sessionStorage marks this one as counted).
function countVisit(): number {
  try {
    let visits = Number(localStorage.getItem(VISITS_KEY) ?? "0") || 0;
    if (sessionStorage.getItem(COUNTED_KEY) !== "1") {
      visits += 1;
      localStorage.setItem(VISITS_KEY, String(visits));
      sessionStorage.setItem(COUNTED_KEY, "1");
    }
    return visits;
  } catch {
    // Storage unavailable — nothing to count with, so don't hold it back.
    return MIN_VISITS;
  }
}

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
  const { t } = useI18n();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useLayoutEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline fallback / install prompt just won't be as reliable — not worth surfacing.
      });
    }

    // Runs before paint so a returning visitor
    // who already dismissed this, or who's already running the installed
    // app (the PWA or a store app), never sees it flash on screen first.
    if (isStandalone() || Capacitor.isNativePlatform()) return;
    let wasDismissed = false;
    try {
      wasDismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Storage unavailable — just show it.
    }
    if (wasDismissed) return;
    if (countVisit() < MIN_VISITS) return;

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

  if (!visible || !HOME_PATHS.has(pathname)) return null;

  return (
    <div className="bg-fog border-b border-ink/10 px-6 py-2 text-sm text-ink no-print">
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
        <p className="text-center">
          {isIOS ? (
            <>
              {t("screens.ui.installIosLead")} <strong className="font-semibold">{t("screens.ui.installAddHome")}</strong>.
            </>
          ) : (
            t("screens.ui.installOther")
          )}
        </p>
        {!isIOS && (
          <button type="button" onClick={install} className="shrink-0 underline font-medium">
            {t("screens.ui.install")}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("screens.ui.dismiss")}
          className="-my-3 -mr-3 flex h-11 w-11 shrink-0 items-center justify-center text-stone hover:text-ink transition"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
