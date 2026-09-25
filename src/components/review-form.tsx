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
    // onSubmit rather than <form action>: React resets a form after its
    // action runs, which would wipe a half-written comment on an error.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        formAction(new FormData(e.currentTarget));
      }}
      className="mt-3 flex flex-col gap-2 rounded-[14px] bg-fog p-3 no-print"
    >
      <span className="text-sm font-medium">{initial ? "Your review" : "Leave a review"}</span>
      <StarRatingInput name="rating" defaultValue={initial?.rating ?? 5} />
      {/* text-base on phones: iOS zooms into any field under 16px on focus. */}
      <TextareaWithCounter
        name="comment"
        rows={2}
        maxLength={1000}
        placeholder="Optional comment"
        aria-label="Comment"
        defaultValue={initial?.comment ?? ""}
        className="resize-none rounded-[14px] border border-neutral-300 bg-background px-3 py-2 text-base outline-none focus:border-neutral-500 md:text-sm dark:border-neutral-700"
      />
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
      >
        {pending ? "Saving…" : initial ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
