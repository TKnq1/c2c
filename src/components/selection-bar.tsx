"use client";

import { IoClose } from "react-icons/io5";
import { useI18n } from "@/components/i18n-provider";

// What to do with the rows ticked in a list (close requests, send one offer to several creators): a bar that floats
// above the phone's tab bar, and from md up sticks to the foot of the window, the way the briefing's save bar does. It
// never pushes the list down when the first box is ticked, and stays in reach however far the list is scrolled.
// Render it after the list, so the sticky bar has the list to stick over.
export function SelectionBar({
  label,
  onClear,
  children,
}: {
  label: string;
  onClear: () => void;
  // The bar's actions (and fields), right of the count.
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <>
      {/* Room at the end of the list on phones, so the fixed bar never covers the last row. */}
      <div aria-hidden className="h-24 md:hidden" />
      <div
        role="region"
        aria-label={label}
        aria-live="polite"
        className="animate-bar-in no-print max-md:fixed max-md:inset-x-4 max-md:bottom-[calc(var(--tabbar-space)-0.25rem)] max-md:z-30 md:sticky md:bottom-4 md:z-10"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded border border-ink/10 bg-background/95 p-2 pl-1 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={onClear}
            aria-label={t("screens.requests.clearSelection")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-fog hover:text-ink dark:text-neutral-400"
          >
            <IoClose className="h-5 w-5" aria-hidden />
          </button>
          <p className="min-w-0 flex-1 text-sm font-medium">{label}</p>
          {children}
        </div>
      </div>
    </>
  );
}
