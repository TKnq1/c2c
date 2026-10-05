"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { IoClose, IoOpenOutline } from "react-icons/io5";
import { useI18n } from "@/components/i18n-provider";

// A route shown as a panel from the right over the page it was opened from
// (an intercepted route, see discover/@panel). Closing goes back in
// history, which is what takes the URL back to the list underneath — so
// the browser's own back button closes it too. `fullPageHref` reloads the
// same URL as its own page.
export function SidePanel({
  label,
  fullPageHref,
  children,
}: {
  label: string;
  fullPageHref?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 no-print">
      <div aria-hidden className="animate-backdrop-in absolute inset-0 bg-black/30" onClick={() => router.back()} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="animate-panel-in absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-background shadow-2xl outline-none"
      >
        <div className="flex shrink-0 items-center justify-end gap-1 border-b border-ink/10 px-3 pt-[calc(var(--safe-top)+8px)] pb-2 md:pt-2">
          {fullPageHref && (
            // Hidden on phones: the panel is already the full screen there.
            // A plain <a>, not <Link>: a client navigation to this URL would
            // be intercepted into the panel again.
            <a
              href={fullPageHref}
              className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm text-neutral-500 transition hover:bg-fog hover:text-ink md:flex dark:text-neutral-400"
            >
              <IoOpenOutline className="h-4 w-4" aria-hidden />
              {t("screens.ui.openFullPage")}
            </a>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t("common.close")}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-fog"
          >
            <IoClose className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
