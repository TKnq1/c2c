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
  redirectTo,
  requirePassword = false,
  className,
  children,
}: {
  // May return { error } instead of throwing — the only way a specific
  // message survives to production (see errorMessage). Gets the password
  // when `requirePassword` is set.
  action: (password: string) => Promise<void | { error?: string }>;
  successMessage: string;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  // Where to go once it worked, for an action that removes the page it's on.
  redirectTo?: string;
  // Asks for the password in the sheet and hands it to the action: for what can't be taken back
  // and shouldn't run from a session someone walked away from.
  requirePassword?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    setError(null);
    if (requirePassword && !password) {
      setError("Enter your password to confirm.");
      return;
    }
    startTransition(async () => {
      try {
        // Only the actions that asked for it get the password (the others take no arguments).
        const result = await (requirePassword ? action(password) : (action as () => Promise<void | { error?: string }>)());
        setPassword("");
        if (result?.error) {
          setError(result.error);
          return;
        }
        toast.success(successMessage);
        setOpen(false);
        if (redirectTo) {
          router.push(redirectTo);
          return;
        }
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
        {requirePassword && (
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            aria-label="Your password"
            className="rounded border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-neutral-500 md:text-sm dark:border-neutral-700"
          />
        )}
        {error && <p className="text-sm font-medium text-ink">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setPassword("");
            }}
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
