"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useExitAnimation } from "@/lib/use-exit-animation";

// Native <dialog> + showModal() gets focus trapping, the page behind going
// inert, and top-layer stacking (above the fixed nav and toasts) for free.
// Bottom sheet on phones, centered card from md up. Closing — Escape,
// backdrop tap, or the parent flipping `open` — plays the exit animation
// first and only calls close() once it's done (see useExitAnimation).
// Children only mount while it's showing, so a form inside starts fresh.
export function Dialog({
  open,
  onClose,
  title,
  media,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  // Full-bleed content above the padded body, e.g. a cover image.
  media?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { present, closing, onExitEnd } = useExitAnimation(open);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (present && !dialog.open) dialog.showModal();
    else if (!present && dialog.open) dialog.close();
  }, [present]);

  return (
    <dialog
      ref={ref}
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
      className="animate-sheet-in m-0 mt-auto w-full max-w-none overflow-hidden rounded-t-[20px] bg-background text-foreground backdrop:bg-black/40 md:m-auto md:max-w-sm md:rounded-[20px]"
    >
      {present && (
        // No display utilities on the <dialog> itself — they'd override the
        // UA's display:none for a closed one. The layout lives in here.
        <div className="flex max-h-[85dvh] flex-col">
          {media}
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-5 pb-[max(var(--safe-bottom),20px)] md:pb-5">
            <h2 id={titleId} className="font-semibold">
              {title}
            </h2>
            {children}
          </div>
        </div>
      )}
    </dialog>
  );
}
