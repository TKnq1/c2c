"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import { toast } from "@/lib/toast";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  useEffect(() => {
    if (state?.resetUrl) toast.info("Reset link generated below.");
  }, [state]);

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
      {state?.resetUrl && (
        <div className="rounded-lg border border-ink/10 p-3 text-sm flex flex-col gap-1">
          <p className="text-neutral-600 dark:text-neutral-400">
            This is a local prototype with no real email sending — here&apos;s your reset link
            directly:
          </p>
          <Link href={state.resetUrl} className="font-medium underline break-all">
            {state.resetUrl}
          </Link>
        </div>
      )}
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
