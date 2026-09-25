"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentStatus, DepositStatus } from "@prisma/client";
import { bulkSendOfferAction } from "@/lib/actions/payments";
import { InterestedCreatorRow } from "@/components/interested-creator-row";
import type { PaymentStage } from "@/components/payment-status-badge";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";

type InterestEntry = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  niche: string;
  email: string;
  platforms: { platform: string; followerCount: number }[];
  paymentStatus: PaymentStatus | null;
  paymentStage: PaymentStage | null;
  amountCents: number | null;
  payoutCents: number | null;
  depositStatus: DepositStatus | null;
  depositCents: number | null;
  hasReview: boolean;
};

export function BulkInterestedCreatorsList({
  requestId,
  interests,
  feeRatePercent,
}: {
  requestId: string;
  interests: InterestEntry[];
  feeRatePercent: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const offerable = interests.filter((i) => i.paymentStatus === null).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkOffer(formData: FormData) {
    setSending(true);
    try {
      const result = await bulkSendOfferAction(requestId, [...selected], formData);
      toast.success(`Offer sent to ${result.count} creator${result.count === 1 ? "" : "s"}.`);
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <form
          action={handleBulkOffer}
          className="no-print flex flex-col gap-2 rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/50"
        >
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium flex-1">{selected.size} selected</p>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm text-neutral-500 hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Clear
            </button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Same offer to everyone selected. Funds only move once each creator accepts, and we hold{" "}
            {feeRatePercent}% of every accepted offer as our platform fee.
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
              disabled={sending}
              className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              {sending ? "Sending…" : `Send offer to ${selected.size}`}
            </button>
          </div>
        </form>
      )}

      {offerable > 1 && (
        <button
          type="button"
          onClick={() =>
            setSelected(new Set(interests.filter((i) => i.paymentStatus === null).map((i) => i.id)))
          }
          className="no-print self-start text-xs text-neutral-500 hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Select all not yet offered ({offerable})
        </button>
      )}

      <div className="flex flex-col gap-3">
        {interests.map((i) => (
          <InterestedCreatorRow
            key={i.id}
            {...i}
            selected={selected.has(i.id)}
            onToggleSelect={() => toggle(i.id)}
          />
        ))}
      </div>
    </div>
  );
}
