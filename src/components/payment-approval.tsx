"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePaymentAction, reportProblemAction, type PaymentActionState } from "@/lib/actions/payments";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Dialog } from "@/components/dialog";
import { TextareaWithCounter } from "@/components/textarea-with-counter";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";

// The brand's side of the approval step, once the creator has submitted
// their post: release the money now, or put it on hold for us to review.
// Used in the chat's offer card and on the Payments page.
export function PaymentApprovalButtons({
  interestId,
  creatorName,
  payoutLabel,
}: {
  interestId: string;
  creatorName: string;
  payoutLabel: string;
}) {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <div className="mt-3 flex flex-col gap-2 no-print">
        <ConfirmActionButton
          action={approvePaymentAction.bind(null, interestId)}
          successMessage={`Payment released to ${creatorName}.`}
          title="Approve and release?"
          description={`${creatorName} gets ${payoutLabel} right away. Only approve if the post is live and matches what you agreed — this can't be undone.`}
          confirmLabel="Approve & release"
          pendingLabel="Releasing…"
          className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite sm:w-auto sm:self-start"
        >
          Approve & release
        </ConfirmActionButton>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="text-xs text-neutral-500 transition hover:text-ink sm:self-start dark:text-neutral-400"
        >
          Problem with the post? Report it
        </button>
      </div>
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} title="Report a problem">
        <ReportProblemForm interestId={interestId} creatorName={creatorName} onDone={() => setReportOpen(false)} />
      </Dialog>
    </>
  );
}

function ReportProblemForm({
  interestId,
  creatorName,
  onDone,
}: {
  interestId: string;
  creatorName: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    // onSubmit rather than <form action>: React resets a form after its
    // action runs, which would wipe what they wrote on an error.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setError(null);
        startTransition(async () => {
          let result: PaymentActionState;
          try {
            result = await reportProblemAction(interestId, undefined, formData);
          } catch (err) {
            result = { error: errorMessage(err) };
          }
          if (result?.success) {
            toast.success("Problem reported — the payment is on hold while we look into it.");
            onDone();
            router.refresh();
          } else {
            setError(result?.error ?? "Something went wrong.");
          }
        });
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        The payment stays on hold — nothing goes to {creatorName} — while we look at the post and talk to you both.
        Then we either release it or refund you.
      </p>
      {/* text-base on phones: iOS zooms into any field under 16px on focus. */}
      <TextareaWithCounter
        name="reason"
        rows={4}
        maxLength={1000}
        required
        autoFocus
        placeholder="What's wrong? E.g. the post was taken down, or it's not what we agreed on."
        aria-label="What's wrong with the post"
        className="resize-none rounded-[14px] border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-neutral-500 md:text-sm dark:border-neutral-700"
      />
      {error && <p className="text-sm text-ink">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
      >
        {pending ? "Reporting…" : "Report problem"}
      </button>
    </form>
  );
}
