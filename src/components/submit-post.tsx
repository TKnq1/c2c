"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPostAction, type PaymentActionState } from "@/lib/actions/payments";
import { Dialog } from "@/components/dialog";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";
import { RELEASE_REVIEW_DAYS } from "@/lib/constants";

// The creator's side of the approval step: the link to their post, which
// the brand then approves (or not) within RELEASE_REVIEW_DAYS.
export function SubmitPostForm({
  interestId,
  brandName,
  defaultUrl,
  onDone,
}: {
  interestId: string;
  brandName: string;
  defaultUrl?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    // onSubmit rather than <form action>: React resets a form after its
    // action runs, which would wipe the pasted link on an error.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          let result: PaymentActionState;
          try {
            result = await submitPostAction(interestId, undefined, formData);
          } catch (err) {
            result = { error: errorMessage(err) };
          }
          if (result?.success) {
            toast.success(`Post submitted — ${brandName} has ${RELEASE_REVIEW_DAYS} days to approve it.`);
            onDone?.();
            router.refresh();
          } else {
            setError(result?.error ?? "Something went wrong.");
          }
        });
      }}
      className="mt-3 flex flex-col gap-2 no-print"
    >
      {/* text-base on phones: iOS zooms into any field under 16px on focus. */}
      <input
        name="proofUrl"
        type="url"
        inputMode="url"
        required
        defaultValue={defaultUrl}
        placeholder="https://www.tiktok.com/@you/video/…"
        aria-label="Link to your post"
        className="rounded-[14px] border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-neutral-500 md:text-sm dark:border-neutral-700"
      />
      {error && <p className="text-sm text-ink">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 sm:self-start"
      >
        {pending ? "Submitting…" : defaultUrl ? "Update link" : "Submit post"}
      </button>
    </form>
  );
}

// The same form in a sheet — from the chat's offer card, and for fixing a
// link that's already been submitted.
export function SubmitPostButton({
  interestId,
  brandName,
  defaultUrl,
  label,
  className,
}: {
  interestId: string;
  brandName: string;
  defaultUrl?: string;
  label: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={defaultUrl ? "Update your post link" : "Submit your post"}>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {defaultUrl
            ? `${brandName} gets a fresh ${RELEASE_REVIEW_DAYS} days to check the new link.`
            : `Paste the link to your live post. ${brandName} has ${RELEASE_REVIEW_DAYS} days to approve it or report a problem — if they don't respond, the payment is released to you automatically.`}
        </p>
        <SubmitPostForm
          interestId={interestId}
          brandName={brandName}
          defaultUrl={defaultUrl}
          onDone={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
