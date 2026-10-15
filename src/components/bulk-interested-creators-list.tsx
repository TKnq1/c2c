"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentStatus, DepositStatus } from "@prisma/client";
import { bulkSendOfferAction } from "@/lib/actions/payments";
import { InterestedCreatorRow } from "@/components/interested-creator-row";
import { SelectionBar } from "@/components/selection-bar";
import type { PaymentStage } from "@/components/payment-status-badge";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";
import { useI18n } from "@/components/i18n-provider";
import { PRO_PLATFORM_FEE_RATE } from "@/lib/constants";

type InterestEntry = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  niche: string;
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
  creatorProNote,
}: {
  requestId: string;
  interests: InterestEntry[];
  feeRatePercent: number;
  // The brand has no Pro: creators with Pro still get the Pro rate (see hasProRate), so the hint mentions it.
  creatorProNote: boolean;
}) {
  const { t } = useI18n();
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
      toast.success(
        result.count === 1
          ? t("screens.requests.offerSentOne", { count: result.count })
          : t("screens.requests.offerSentMany", { count: result.count }),
      );
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
      {offerable > 1 && (
        <button
          type="button"
          onClick={() =>
            setSelected(new Set(interests.filter((i) => i.paymentStatus === null).map((i) => i.id)))
          }
          className="no-print self-start text-xs text-neutral-500 hover:text-neutral-900 transition dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          {t("screens.requests.selectNotOffered", { count: offerable })}
        </button>
      )}

      <div className="divide-y divide-ink/10 overflow-hidden rounded bg-fog">
        {interests.map((i) => (
          <InterestedCreatorRow
            key={i.id}
            {...i}
            selected={selected.has(i.id)}
            onToggleSelect={() => toggle(i.id)}
          />
        ))}
      </div>
      {selected.size > 0 && (
        <SelectionBar label={t("screens.requests.selected", { count: selected.size })} onClear={() => setSelected(new Set())}>
          <form action={handleBulkOffer} className="flex w-full items-center gap-2 pl-3 md:w-auto md:pl-0">
            <label className="flex min-h-11 flex-1 items-center gap-1.5 rounded border border-neutral-300 px-3 md:w-36 md:flex-none dark:border-neutral-700">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">€</span>
              <input
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                placeholder="250"
                aria-label={t("screens.requests.offerAmount")}
                required
                className="w-full min-w-0 bg-transparent text-base outline-none md:text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={sending}
              className="min-h-11 shrink-0 whitespace-nowrap rounded-full bg-ink px-4 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
            >
              {sending ? t("screens.requests.sendingOffers") : t("screens.requests.sendOfferTo", { count: selected.size })}
            </button>
          </form>
          <p className="w-full pl-3 text-xs text-neutral-600 dark:text-neutral-400">
            {creatorProNote
              ? t("screens.requests.bulkOfferHintCreatorPro", { fee: feeRatePercent, pro: PRO_PLATFORM_FEE_RATE * 100 })
              : t("screens.requests.bulkOfferHint", { fee: feeRatePercent })}
          </p>
        </SelectionBar>
      )}
    </div>
  );
}
