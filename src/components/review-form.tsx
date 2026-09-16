"use client";

import { submitReviewAction } from "@/lib/actions/reviews";
import { StarRatingInput } from "@/components/star-rating-input";
import { TextareaWithCounter } from "@/components/textarea-with-counter";
import { useToastFormAction } from "@/lib/use-toast-form-action";

type Props = {
  interestId: string;
  initial?: { rating: number; comment: string | null };
};

export function ReviewForm({ interestId, initial }: Props) {
  const [state, formAction, pending] = useToastFormAction(
    submitReviewAction.bind(null, interestId),
    "Review saved.",
  );

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-xl border border-ink/10 p-3 no-print">
      <span className="text-sm font-medium">{initial ? "Your review" : "Leave a review"}</span>
      <StarRatingInput name="rating" defaultValue={initial?.rating ?? 5} />
      <TextareaWithCounter
        name="comment"
        rows={2}
        maxLength={1000}
        placeholder="Optional comment"
        aria-label="Comment"
        defaultValue={initial?.comment ?? ""}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
      />
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 self-start"
      >
        {pending ? "Saving…" : initial ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
