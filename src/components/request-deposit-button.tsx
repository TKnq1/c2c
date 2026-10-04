"use client";

import { useState } from "react";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { requestDepositAction } from "@/lib/actions/deposits";
import { AmountForm } from "@/components/amount-form";
import { Dialog } from "@/components/dialog";
import { useI18n } from "@/components/i18n-provider";

// Opens the amount sheet, same as Make an offer, instead of an inline form
// under every interested creator.
export function RequestDepositButton({
  interestId,
  className = "inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3.5 py-1.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700",
}: {
  interestId: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <IoShieldCheckmarkOutline className="h-4 w-4" />
        {t("screens.payments.copy.requestDeposit")}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("screens.payments.copy.requestDepositTitle")}>
        <AmountForm
          action={requestDepositAction.bind(null, interestId)}
          hint={t("screens.payments.copy.depositHint")}
          submitLabel={t("screens.payments.copy.requestDeposit")}
          pendingLabel={t("screens.payments.copy.requesting")}
          successMessage={t("screens.payments.copy.depositRequested")}
          placeholder="50.00"
          label={t("screens.payments.copy.depositAmount")}
          onDone={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
