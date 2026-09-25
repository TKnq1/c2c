"use client";

import { useState } from "react";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { requestDepositAction } from "@/lib/actions/deposits";
import { AmountForm } from "@/components/amount-form";
import { Dialog } from "@/components/dialog";

// Opens the amount sheet, same as Make an offer, instead of an inline form
// under every interested creator.
export function RequestDepositButton({
  interestId,
  className = "inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3.5 py-1.5 text-sm font-medium transition hover:border-neutral-400 dark:border-neutral-700",
}: {
  interestId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <IoShieldCheckmarkOutline className="h-4 w-4" />
        Request deposit
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Request a deposit">
        <AmountForm
          action={requestDepositAction.bind(null, interestId)}
          hint="A refundable deposit the creator pays before you ship product. You return it in full once the post is live — or keep it if they never deliver. No platform fee."
          submitLabel="Request deposit"
          pendingLabel="Requesting…"
          successMessage="Deposit requested."
          placeholder="50.00"
          label="Deposit amount in euros"
          onDone={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
