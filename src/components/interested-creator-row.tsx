"use client";

import Link from "next/link";
import type { PaymentStatus, DepositStatus } from "@prisma/client";
import { rejectInterestAction } from "@/lib/actions/requests";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { CollabStatus } from "@/components/collab-status";
import { useUndoableAction } from "@/lib/use-undoable-action";
import { formatFollowers } from "@/lib/format";

type Props = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  niche: string;
  email: string;
  platforms: { platform: string; followerCount: number }[];
  paymentStatus: PaymentStatus | null;
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
  email,
  platforms,
  paymentStatus,
  amountCents,
  payoutCents,
  depositStatus,
  depositCents,
  hasReview,
  selected,
  onToggleSelect,
}: Props) {
  const { pending, trigger } = useUndoableAction(async () => {
    await rejectInterestAction(id);
  });

  if (pending) return null;

  return (
    <div className="rounded-2xl border border-ink/10 p-4 flex gap-3">
      {onToggleSelect && paymentStatus === null && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={onToggleSelect}
          aria-label={`Select ${displayName}`}
          className="h-4 w-4 mt-1 shrink-0 appearance-none rounded border border-neutral-300 bg-white checked:border-neutral-900 checked:bg-neutral-900 transition dark:border-neutral-600 dark:bg-neutral-800 dark:checked:border-white dark:checked:bg-white"
        />
      )}
      <Avatar src={avatarUrl} name={displayName} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{displayName}</p>
        <p className="text-sm text-neutral-500 flex flex-wrap items-center gap-x-1.5 gap-y-1 dark:text-neutral-400">
          <span>{niche} ·</span>
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
            className="rounded bg-ink text-paper px-3 py-1 text-xs font-medium hover:bg-graphite transition"
          >
            Message
          </Link>
          <a href={`mailto:${email}`} className="underline text-neutral-500 dark:text-neutral-400">
            {email}
          </a>
        </p>
        <CollabStatus
          paymentStatus={paymentStatus}
          amountCents={amountCents}
          payoutCents={payoutCents}
          depositStatus={depositStatus}
          depositCents={depositCents}
          hasReview={hasReview}
          paymentsHref="/dashboard/startup/payments"
        />
        <button
          type="button"
          onClick={() => trigger("Creator removed.", "Creator restored.")}
          className="text-xs text-neutral-400 hover:text-ink transition mt-2 dark:text-neutral-500"
        >
          Not a fit — remove
        </button>
      </div>
    </div>
  );
}
