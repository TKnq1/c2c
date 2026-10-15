"use client";

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { IoClose } from "react-icons/io5";
import { useExitAnimation } from "@/lib/use-exit-animation";
import { useI18n } from "@/components/i18n-provider";

// Native <dialog> + showModal() gets focus trapping, the page behind going
// inert, and top-layer stacking (above the fixed nav and toasts) for free.
// Bottom sheet on phones, centered card from md up (or, given an `anchor`, a panel that hangs under the button it was
// opened from, see FilterSheet). Closing — Escape,
// backdrop tap, or the parent flipping `open` — plays the exit animation
// first and only calls close() once it's done (see useExitAnimation).
// Children only mount while it's showing, so a form inside starts fresh.
export function Dialog({
  open,
  onClose,
  title,
  media,
  anchor,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  // Full-bleed content above the padded body, e.g. a cover image.
  media?: ReactNode;
  // From md up the dialog sits at this spot (px from the viewport's top and right edge) instead of the middle.
  anchor?: { top: number; right: number } | null;
  // A wider card/panel on desktop, for content in two columns.
  wide?: boolean;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { present, closing, onExitEnd } = useExitAnimation(open);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (present && !dialog.open) dialog.showModal();
    else if (!present && dialog.open) dialog.close();
  }, [present]);

  const width = wide ? "md:max-w-xl" : "md:max-w-sm";
  // The panel can't be wider than the room left of the button, and its body scrolls within the room below it.
  const place = anchor
    ? "md:fixed md:inset-auto md:top-[var(--anchor-top)] md:right-[var(--anchor-right)] md:m-0 md:w-[min(100%,calc(100vw-var(--anchor-right)-16px))] md:shadow-2xl"
    : "md:m-auto";
  const anchorStyle = anchor ? ({ "--anchor-top": `${anchor.top}px`, "--anchor-right": `${anchor.right}px` } as CSSProperties) : undefined;

  return (
    <dialog
      ref={ref}
      style={anchorStyle}
      aria-labelledby={titleId}
      data-state={closing ? "closing" : undefined}
      // Escape would close() natively and skip the exit animation — hand
      // it to the parent instead, same as every other way of closing.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      // The content wrapper fills the whole box, so a click whose target is
      // the <dialog> itself can only have landed on the backdrop.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      // Only the dialog's own animation counts — the ::backdrop fade fires
      // here too (pseudoElement set), and may finish first.
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && !e.pseudoElement) onExitEnd();
      }}
      className={`animate-sheet-in m-0 mt-auto w-full max-w-none overflow-hidden overscroll-contain rounded-t-[20px] bg-background text-foreground backdrop:bg-black/40 ${place} ${width} md:rounded-[20px]`}
    >
      {present && (
        // No display utilities on the <dialog> itself — they'd override the
        // UA's display:none for a closed one. The layout lives in here.
        <div className={`flex max-h-[85dvh] flex-col ${anchor ? "md:max-h-[calc(100dvh-var(--anchor-top)-24px)]" : ""}`}>
          {media}
          {/* Scrolls up and down only: a sideways swipe neither pans the sheet's content nor reaches the page behind it.
              The media above (a photo strip) keeps its own sideways swipe. */}
          <div className="flex min-h-0 touch-pan-y flex-col gap-4 overflow-y-auto overflow-x-hidden overscroll-contain p-5 pb-[max(var(--safe-bottom),20px)] md:pb-5">
            {/* A visible way out: tapping beside a sheet or Escape isn't obvious on a phone. */}
            <div className="-mr-2 -mt-2 flex items-center justify-between gap-3">
              <h2 id={titleId} className="min-w-0 font-semibold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("common.close")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-fog hover:text-ink dark:text-neutral-400"
              >
                <IoClose className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </dialog>
  );
}
