"use client";

import { sendOfferAction } from "@/lib/actions/payments";
import { useToastFormAction } from "@/lib/use-toast-form-action";

export function SendOfferForm({ interestId, feeRatePercent }: { interestId: string; feeRatePercent: number }) {
  const [state, formAction, pending] = useToastFormAction(
    sendOfferAction.bind(null, interestId),
    "Offer sent.",
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2 rounded-xl border border-ink/10 p-3">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Real escrow via Stripe. The creator can accept or decline; only once they accept do you
        pay (held until they mark the work as posted, then released minus our {feeRatePercent}%
        platform fee).
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">€</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="1"
          placeholder="250.00"
          aria-label="Offer amount in euros"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 w-32 dark:border-neutral-700"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 shrink-0 whitespace-nowrap"
        >
          {pending ? "Sending…" : "Send offer"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
    </form>
  );
}
