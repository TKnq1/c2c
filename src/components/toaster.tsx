"use client";

import { useEffect, useState } from "react";
import { subscribeToasts, toast, type Toast } from "@/lib/toast";

const VARIANT_STYLES: Record<Toast["variant"], string> = {
  success: "border-ink/10 bg-paper text-ink",
  error: "bg-ink text-paper",
  info: "border-ink/10 bg-paper text-ink",
};

const AUTO_DISMISS_MS = 4000;
const EXIT_MS = 180;

function ToastItem({ item }: { item: Toast }) {
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(() => toast.dismiss(item.id), EXIT_MS);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setClosing(true);
      setTimeout(() => toast.dismiss(item.id), EXIT_MS);
    }, item.durationMs ?? AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [item.id, item.durationMs]);

  return (
    <div
      role="status"
      className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3 ${VARIANT_STYLES[item.variant]} ${closing ? "toast-out" : "toast-in"}`}
    >
      <span>{item.message}</span>
      <div className="flex items-center gap-3 shrink-0">
        {item.action && (
          <button
            type="button"
            onClick={() => {
              item.action!.onClick();
              close();
            }}
            className="font-medium underline underline-offset-2 hover:opacity-70 transition"
          >
            {item.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={close}
          className="opacity-60 hover:opacity-100 transition"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    // Clears the fixed mobile tab bar (~69px content + its own safe-area
    // padding, see nav.tsx) with room to spare, instead of the flat
    // bottom-4 every fixed-bottom element not near the tab bar uses — that
    // offset was landing the toast half-hidden behind the bar. No tab bar
    // exists past md, so it reverts to the tighter bottom-4 there.
    //
    // On mobile: left-4 AND right-4, with NO width class — width is left
    // auto so the browser solves it from those two edges (the gap between
    // them), which is the one combination that can't overflow either side.
    // Explicitly setting width here (w-full) alongside both left and right
    // over-constrains the box; for LTR that means left+width win and right
    // gets silently dropped, so a w-full box anchored by left-4 (or
    // right-4 alone, which implies left:auto=0) always ends up wider than
    // the gap and overflows past whichever edge lost. Past md: left-auto
    // hands left back to the browser and w-full max-w-sm apply instead,
    // for the usual bottom-right-anchored, width-capped toast stack — safe
    // there since only one edge (right) is ever set alongside the width.
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+84px)] left-4 right-4 md:bottom-4 md:left-auto md:w-full md:max-w-sm z-[60] flex flex-col gap-2 pointer-events-none no-print">
      {toasts.map((t) => (
        <ToastItem key={t.id} item={t} />
      ))}
    </div>
  );
}
