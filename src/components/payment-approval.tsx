"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePaymentAction, reportProblemAction, type PaymentActionState } from "@/lib/actions/payments";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Dialog } from "@/components/dialog";
import { TextareaWithCounter } from "@/components/textarea-with-counter";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";
import { useI18n } from "@/components/i18n-provider";

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
  const { t } = useI18n();
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <div className="mt-3 flex flex-col gap-2 no-print">
        <ConfirmActionButton
          action={approvePaymentAction.bind(null, interestId)}
          successMessage={t("screens.payments.copy.releasedToName", { name: creatorName })}
          title={t("screens.payments.copy.approveTitle")}
          description={t("screens.payments.copy.approveBody", { name: creatorName, payout: payoutLabel })}
          confirmLabel={t("screens.payments.copy.approveRelease")}
          pendingLabel={t("screens.payments.copy.releasing")}
          className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite sm:w-auto sm:self-start"
        >
          {t("screens.payments.copy.approveRelease")}
        </ConfirmActionButton>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="text-xs text-neutral-500 transition hover:text-ink sm:self-start dark:text-neutral-400"
        >
          {t("screens.payments.copy.reportIt")}
        </button>
      </div>
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} title={t("screens.payments.copy.reportTitle")}>
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
  const { t } = useI18n();
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
            toast.success(t("screens.payments.copy.problemReported"));
            onDone();
            router.refresh();
          } else {
            setError(result?.error ?? t("screens.payments.copy.somethingWrong"));
          }
        });
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t("screens.payments.copy.reportBody", { name: creatorName })}
      </p>
      {/* text-base on phones: iOS zooms into any field under 16px on focus. */}
      <TextareaWithCounter
        name="reason"
        rows={4}
        maxLength={1000}
        required
        autoFocus
        placeholder={t("screens.payments.copy.whatsWrong")}
        aria-label={t("screens.payments.copy.whatsWrongLabel")}
        className="resize-none rounded border border-neutral-300 bg-transparent px-3 py-2.5 text-base outline-none focus:border-neutral-500 md:text-sm dark:border-neutral-700"
      />
      {error && <p className="text-sm text-ink">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
      >
        {pending ? t("screens.payments.copy.reporting") : t("screens.payments.copy.reportProblem")}
      </button>
    </form>
  );
}
