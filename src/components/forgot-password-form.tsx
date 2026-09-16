"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  if (state?.success) {
    return (
      <p className="text-sm text-neutral-700 dark:text-neutral-300">
        If that email has an account, we&apos;ve sent a reset link — check your inbox.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
        />
      </div>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
