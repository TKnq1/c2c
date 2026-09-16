"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction } from "@/lib/actions/account";

export function DeleteAccountForm() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccountAction, undefined);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-graphite hover:text-ink underline transition"
      >
        Delete account
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded border border-ink bg-fog p-3">
      <p className="text-sm text-ink">
        This permanently deletes your account and everything tied to it — profile, requests or interests,
        messages, reviews, payment history. This can&apos;t be undone.
      </p>
      <input
        type="password"
        name="password"
        required
        placeholder="Enter your password to confirm"
        aria-label="Password"
        className="rounded border border-ink px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-ink font-medium">{state.error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Permanently delete my account"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm text-neutral-500 hover:text-neutral-800 transition dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
