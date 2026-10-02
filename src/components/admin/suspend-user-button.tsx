"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/dialog";
import { toast } from "@/lib/toast";
import { suspendUserAction } from "@/lib/actions/admin";

// Suspending needs a reason (shown to other admins on the user's page), so
// this is its own sheet instead of a plain ConfirmActionButton.
export function SuspendUserButton({ userId, label, isBrand }: { userId: string; label: string; isBrand: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await suspendUserAction(userId, reason).catch(() => ({
        error: "Couldn't reach the server. Try again.",
      }));
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(`${label} is suspended.`);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setReason("");
          setOpen(true);
        }}
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite"
      >
        Suspend account
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Suspend ${label}?`}>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            They can&apos;t sign in until you unsuspend them, and they&apos;re signed out within a few minutes.
            {isBrand && " Their open requests are closed."}
          </p>
          <label htmlFor="suspend-reason" className="text-sm font-medium">
            Reason
          </label>
          <textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            required
            placeholder="e.g. Repeated spam messages to creators"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          />
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
              type="submit"
              disabled={pending}
              className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
            >
              {pending ? "Suspending…" : "Suspend"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
