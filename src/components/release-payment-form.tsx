"use client";

import { releasePaymentAction } from "@/lib/actions/payments";
import { useToastFormAction } from "@/lib/use-toast-form-action";

export function ReleasePaymentForm({ interestId }: { interestId: string }) {
  const [state, formAction, pending] = useToastFormAction(
    releasePaymentAction.bind(null, interestId),
    "Payment released.",
  );

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 no-print">
      <input
        name="proofUrl"
        type="url"
        placeholder="Link to the post (optional)"
        aria-label="Link to the posted content"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50"
      >
        {pending ? "Releasing…" : "Mark as posted & release payment"}
      </button>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
    </form>
  );
}
