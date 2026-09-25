"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";

type AmountActionState = { error?: string; success?: boolean } | undefined;

// The euro-amount sheet behind Make an offer, Counter and Request a
// deposit: what happens next, one € field, one button.
export function AmountForm({
  action,
  hint,
  submitLabel,
  pendingLabel = "Sending…",
  successMessage,
  placeholder = "250.00",
  label = "Amount in euros",
  onDone,
}: {
  action: (prevState: AmountActionState, formData: FormData) => Promise<AmountActionState>;
  hint: string;
  submitLabel: string;
  pendingLabel?: string;
  successMessage: string;
  placeholder?: string;
  label?: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    // onSubmit rather than <form action>: React resets a form after its
    // action runs, which would wipe the typed amount on a validation error.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          let result: AmountActionState;
          try {
            result = await action(undefined, formData);
          } catch (err) {
            result = { error: errorMessage(err) };
          }
          if (result?.success) {
            toast.success(successMessage);
            onDone();
            // Not every action revalidates the page it's used on (the offer
            // actions don't touch the chat, for one).
            router.refresh();
          } else {
            setError(result?.error ?? "Something went wrong.");
          }
        });
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{hint}</p>
      {/* text-base on phones: iOS zooms into any field under 16px on focus. */}
      <label className="flex items-center gap-2 rounded-[14px] border border-neutral-300 px-3 focus-within:border-neutral-500 dark:border-neutral-700">
        <span className="text-neutral-500">€</span>
        <input
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="1"
          required
          autoFocus
          placeholder={placeholder}
          aria-label={label}
          className="w-full bg-transparent py-2.5 text-base outline-none md:text-sm"
        />
      </label>
      {error && <p className="text-sm text-ink">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
