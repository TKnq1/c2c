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
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-full max-w-sm pointer-events-none no-print">
      {toasts.map((t) => (
        <ToastItem key={t.id} item={t} />
      ))}
    </div>
  );
}
