"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/dialog";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";

// For actions that can't be taken back — a refund, keeping a deposit,
// declining an offer. The trigger only opens a confirmation sheet (the same
// one Block uses) and the action runs from its confirm button, instead of a
// native confirm() popup that looks nothing like the rest of the app.
export function ConfirmActionButton({
  action,
  successMessage,
  title,
  description,
  confirmLabel,
  pendingLabel = "Working…",
  className,
  children,
}: {
  // May return { error } instead of throwing — the only way a specific
  // message survives to production (see errorMessage).
  action: () => Promise<void | { error?: string }>;
  successMessage: string;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result?.error) {
          setError(result.error);
          return;
        }
        toast.success(successMessage);
        setOpen(false);
        // Not every action revalidates the page it's used on (the chat
        // doesn't get revalidated by the offer actions, for one).
        router.refresh();
      } catch (err) {
        // In the sheet, not a toast: a modal dialog sits in the browser's
        // top layer, above any z-index, so a toast would land behind it.
        setError(errorMessage(err));
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={className}
      >
        {children}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
        {error && <p className="text-sm font-medium text-ink">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </Dialog>
    </>
  );
}
