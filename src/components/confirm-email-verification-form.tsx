"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmEmailVerificationAction } from "@/lib/actions/auth";
import { useActionToast } from "@/lib/use-action-toast";

export function ConfirmEmailVerificationForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    confirmEmailVerificationAction.bind(null, token),
    undefined,
  );
  useActionToast(state, "Email verified.");

  if (state?.success) {
    return (
      <>
        <p className="text-sm text-ink">Your email is now verified.</p>
        <Link href="/dashboard" className="font-medium text-neutral-900 underline dark:text-neutral-100">
          Go to dashboard
        </Link>
      </>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 items-center">
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Confirm verification"}
      </button>
    </form>
  );
}
