"use client";

import { useState } from "react";
import { acceptOfferAction, declineOfferAction, counterOfferAction } from "@/lib/actions/payments";
import { ActionButton } from "@/components/action-button";
import { useToastFormAction } from "@/lib/use-toast-form-action";

export function OfferResponseActions({ interestId }: { interestId: string }) {
  const [countering, setCountering] = useState(false);
  const [state, formAction, pending] = useToastFormAction(
    counterOfferAction.bind(null, interestId),
    "Counter-offer sent.",
  );

  if (countering) {
    return (
      <form action={formAction} className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">€</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="1"
            placeholder="Your counter"
            aria-label="Counter-offer amount in euros"
            required
            autoFocus
            className="rounded-lg border border-neutral-300 px-3 py-2 w-32 dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            {pending ? "Sending…" : "Send counter"}
          </button>
          <button
            type="button"
            onClick={() => setCountering(false)}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100 shrink-0"
          >
            Cancel
          </button>
        </div>
        {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-2 flex-wrap">
      <ActionButton
        action={acceptOfferAction.bind(null, interestId)}
        successMessage="Offer accepted."
        className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 shrink-0"
      >
        Accept
      </ActionButton>
      <button
        type="button"
        onClick={() => setCountering(true)}
        className="text-sm text-neutral-600 hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100 shrink-0"
      >
        Counter
      </button>
      <ActionButton
        action={declineOfferAction.bind(null, interestId)}
        successMessage="Offer declined."
        confirmMessage="Decline this offer?"
        className="text-xs text-neutral-400 hover:text-ink transition disabled:opacity-50 shrink-0"
      >
        Decline
      </ActionButton>
    </div>
  );
}
