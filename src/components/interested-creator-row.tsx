"use client";

import Link from "next/link";
import type { PaymentStatus, DepositStatus } from "@prisma/client";
import { rejectInterestAction } from "@/lib/actions/requests";
import { Avatar } from "@/components/avatar";
import { SelectCheckbox } from "@/components/select-checkbox";
import { PlatformIcon } from "@/components/platform-icons";
import { CollabStatus } from "@/components/collab-status";
import type { PaymentStage } from "@/components/payment-status-badge";
import { useUndoableAction } from "@/lib/use-undoable-action";
import { formatFollowers } from "@/lib/format";
import { useI18n } from "@/components/i18n-provider";
import { nicheLabel } from "@/lib/i18n/labels";

type Props = {
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
  selected?: boolean;
  onToggleSelect?: () => void;
};

export function InterestedCreatorRow({
  id,
  displayName,
  avatarUrl,
  niche,
  platforms,
  paymentStatus,
  paymentStage,
  amountCents,
  payoutCents,
  depositStatus,
  depositCents,
  hasReview,
  selected,
  onToggleSelect,
}: Props) {
  const { t } = useI18n();
  const { pending, trigger } = useUndoableAction(async () => {
    await rejectInterestAction(id);
  });

  if (pending) return null;

  return (
    <div className="flex gap-3 px-4 py-3">
      {onToggleSelect && paymentStatus === null && (
        <SelectCheckbox checked={!!selected} onChange={onToggleSelect} label={t("screens.requests.select", { title: displayName })} className="-my-1.5 -ml-3" />
      )}
      <Avatar src={avatarUrl} name={displayName} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{displayName}</p>
        <p className="text-sm text-neutral-500 flex flex-wrap items-center gap-x-1.5 gap-y-1 dark:text-neutral-400">
          <span>{nicheLabel(t, niche)} ·</span>
          {platforms.map((p) => (
            <span key={p.platform} className="inline-flex items-center gap-1">
              <PlatformIcon platform={p.platform} className="h-3.5 w-3.5" />
              {formatFollowers(p.followerCount)}
            </span>
          ))}
        </p>
        <p className="text-sm text-neutral-700 mt-2 flex items-center gap-3 dark:text-neutral-300">
          <Link
            href={`/dashboard/messages/${id}`}
            className="rounded-full bg-ink text-paper px-3 py-1 text-xs font-medium hover:bg-graphite transition"
          >
            {t("screens.messages.message")}
          </Link>
        </p>
        <CollabStatus
          paymentStage={paymentStage}
          amountCents={amountCents}
          payoutCents={payoutCents}
          depositStatus={depositStatus}
          depositCents={depositCents}
          hasReview={hasReview}
          paymentsHref="/dashboard/startup/payments"
        />
        <button
          type="button"
          onClick={() => trigger(t("screens.ui.creatorRemoved"), t("screens.ui.creatorRestored"))}
          className="mt-2 block text-xs text-neutral-400 hover:text-ink transition dark:text-neutral-500"
        >
          {t("screens.ui.notAFit")}
        </button>
      </div>
    </div>
  );
}
