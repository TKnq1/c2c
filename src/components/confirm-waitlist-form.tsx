"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmWaitlistAction } from "@/lib/actions/waitlist";
import { Spinner } from "@/components/spinner";

// The heading and text live here too, so the whole block turns into the
// confirmation once the button is pressed.
export function ConfirmWaitlistForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState(confirmWaitlistAction.bind(null, token), undefined);

  if (state?.ok) return <WaitlistConfirmed />;

  return (
    <form action={formAction} className="flex flex-col items-center gap-4">
      <h1 className="font-display text-title-1 font-bold">Confirm your email</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        <span className="font-semibold text-ink">{email}</span> gets one email from us: the day the comtor apps are out
        on iOS and Android.
      </p>
      {state?.error && (
        <p role="alert" className="text-sm text-ink">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-graphite disabled:cursor-wait"
      >
        {pending ? (
          <span className="relative inline-flex items-center justify-center">
            <span className="invisible">Yes, put me on the list</span>
            <Spinner className="absolute h-4 w-4" />
          </span>
        ) : (
          "Yes, put me on the list"
        )}
      </button>
    </form>
  );
}

// Also what the page shows when the link is opened again later.
export function WaitlistConfirmed() {
  return (
    <div role="status" className="flex flex-col items-center gap-4">
      <h1 className="font-display text-title-1 font-bold">You&apos;re on the list.</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        We&apos;ll email you the day the apps are out. Until then, comtor already works in your browser.
      </p>
      <Link
        href="/signup"
        className="rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-graphite"
      >
        Start in your browser
      </Link>
    </div>
  );
}
