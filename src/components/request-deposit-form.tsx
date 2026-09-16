"use client";

import { requestDepositAction } from "@/lib/actions/deposits";
import { useToastFormAction } from "@/lib/use-toast-form-action";

export function RequestDepositForm({ interestId }: { interestId: string }) {
  const [state, formAction, pending] = useToastFormAction(
    requestDepositAction.bind(null, interestId),
    "Deposit requested.",
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2 rounded-xl border border-ink/10 p-3">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Refundable deposit for shipped product — held until you confirm the content was posted,
        then returned to the creator in full. No platform fee.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">€</span>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="1"
          placeholder="50.00"
          aria-label="Deposit amount in euros"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 w-32 dark:border-neutral-700"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 shrink-0 whitespace-nowrap"
        >
          {pending ? "Requesting…" : "Request deposit"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
    </form>
  );
}
