"use client";

import Link from "next/link";
import { expressInterestAction, withdrawInterestAction } from "@/lib/actions/requests";
import { Avatar } from "@/components/avatar";
import { ActionButton } from "@/components/action-button";
import { useUndoableAction } from "@/lib/use-undoable-action";
import { LocalDate } from "@/components/local-date";
import { useI18n } from "@/components/i18n-provider";
import { presetLabel } from "@/lib/i18n/labels";

type Props = {
  id: string;
  title: string;
  minFollowers: number;
  budget: string | null;
  platform: string | null;
  deliverables: string | null;
  postBy: string | null;
  companyName: string;
  companyAvatarUrl: string | null;
  // The brand's profile, linked from its name.
  brandHref: string;
  coverUrl: string | null;
  interestId: string | null;
  // True when this brand reached out directly rather than the creator
  // applying — same underlying Interest row, but "Withdraw interest" would
  // be a lie if the creator never expressed any.
  contactedByStartup: boolean;
  // Matches' work list: where the collab stands, the agreed (or offered)
  // amount and when it started, as columns from md. Withdrawing only makes
  // sense before any money is involved.
  stage?: { label: string; emphasis: boolean };
  amount?: string | null;
  matchedAt?: number;
  canWithdraw?: boolean;
};

export function RequestCard({
  id,
  title,
  minFollowers,
  budget,
  platform,
  deliverables,
  postBy,
  companyName,
  companyAvatarUrl,
  brandHref,
  coverUrl,
  interestId,
  contactedByStartup,
  stage,
  amount,
  matchedAt,
  canWithdraw = true,
}: Props) {
  const { t, locale } = useI18n();
  const { pending, trigger } = useUndoableAction(async () => {
    await withdrawInterestAction(interestId!);
  });

  if (pending) return null;

  const details = [
    platform && deliverables
      ? presetLabel(t, deliverables)
      : t("screens.requests.minFollowersLine", { count: minFollowers.toLocaleString(locale) }),
    postBy ? t("screens.requests.postByValue", { date: postBy }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // A row in the Matches group: the request's cover photo (or, without one,
  // the brand's logo), who and what, the budget, then the chat and the way
  // out, which sit on the right from md up instead of under the text.
  return (
    <div className="flex items-start gap-3 px-4 py-3 md:items-center md:gap-4">
      {coverUrl ? (
        <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded bg-paper">
          {/* Served by our own image route; nothing for next/image to do. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      ) : (
        <Avatar src={companyAvatarUrl} name={companyName} size={56} />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Link
            href={brandHref}
            className="self-start truncate text-footnote text-neutral-500 transition hover:text-ink hover:underline dark:text-neutral-400"
          >
            {companyName}
          </Link>
          <h3 className="line-clamp-2 font-bold leading-snug">{title}</h3>
          <p className="truncate text-footnote text-neutral-500 dark:text-neutral-400">
            {budget && <span className="font-bold text-ink">{budget}</span>}
            {budget && details ? " · " : ""}
            {details}
          </p>
          {contactedByStartup && (
            <p className="text-footnote text-neutral-500 dark:text-neutral-400">{t("screens.ui.reachedOut", { name: companyName })}</p>
          )}
          {stage && (
            <span
              className={`mt-1 inline-flex self-start rounded-full px-2.5 py-0.5 text-xs font-medium md:hidden ${
                stage.emphasis ? "bg-ink text-paper" : "border border-ink/15"
              }`}
            >
              {stage.label}
            </span>
          )}
        </div>
        {stage && (
          <div className="hidden w-64 shrink-0 items-center gap-4 text-sm md:flex">
            <span
              className={`w-32 shrink-0 truncate rounded-full px-2.5 py-0.5 text-center text-xs font-medium ${
                stage.emphasis ? "bg-ink text-paper" : "border border-ink/15"
              }`}
            >
              {stage.label}
            </span>
            <span className="flex flex-1 flex-col items-end">
              <span className="font-semibold tabular-nums">{amount ?? "–"}</span>
              {matchedAt !== undefined && (
                <span className="text-footnote text-neutral-500 dark:text-neutral-400">
                  <LocalDate ms={matchedAt} />
                </span>
              )}
            </span>
          </div>
        )}
        {interestId ? (
          <div
            className={`mt-2 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 md:mt-0 md:flex-row-reverse ${
              // A fixed width in the work list, so the stage and amount
              // columns line up whether or not a row can be withdrawn.
              stage ? "md:w-60" : ""
            }`}
          >
            <Link
              href={`/dashboard/messages/${interestId}`}
              className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper transition hover:bg-graphite"
            >
              {t("screens.messages.message")}
            </Link>
            {canWithdraw && (
              <button
                type="button"
                onClick={() =>
                  contactedByStartup
                    ? trigger(t("screens.ui.declined"), t("screens.ui.restored"))
                    : trigger(t("screens.ui.interestWithdrawn"), t("screens.ui.interestRestored"))
                }
                className="text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400"
              >
                {contactedByStartup ? t("screens.payments.copy.decline") : t("screens.ui.withdrawInterest")}
              </button>
            )}
          </div>
        ) : (
          <ActionButton
            action={expressInterestAction.bind(null, id)}
            successMessage={t("screens.ui.interestSent")}
            className="mt-2 self-start rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50 md:mt-0 md:self-center"
          >
            {t("screens.ui.imInterested")}
          </ActionButton>
        )}
      </div>
    </div>
  );
}
