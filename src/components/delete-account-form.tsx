"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction } from "@/lib/actions/account";
import { Dialog } from "@/components/dialog";
import { SettingsRow } from "@/components/settings-section";

// Behind its own sheet, with the password as the confirmation — the same
// sheet every other can't-be-undone action in the app uses, rather than a
// form unfolding in the middle of the settings.
export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccountAction, undefined);

  return (
    <>
      <SettingsRow label="Delete account" hint="Permanently removes your account and everything in it.">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:border-ink dark:border-neutral-700"
        >
          Delete
        </button>
      </SettingsRow>
      <Dialog open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <form action={formAction} className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            This permanently deletes your account and everything tied to it: profile, requests or interests,
            messages, reviews, payment history. It can&apos;t be undone.
          </p>
          {/* text-base on phones: iOS zooms into any field under 16px on focus. */}
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
            aria-label="Password"
            className="rounded border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-neutral-500 md:text-sm dark:border-neutral-700"
          />
          {state?.error && <p className="text-sm font-medium text-ink">{state.error}</p>}
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
              {pending ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
