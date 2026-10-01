"use client";

import Link from "next/link";
import { expressInterestAction, withdrawInterestAction } from "@/lib/actions/requests";
import { Avatar } from "@/components/avatar";
import { ActionButton } from "@/components/action-button";
import { useUndoableAction } from "@/lib/use-undoable-action";

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
  coverUrl: string | null;
  interestId: string | null;
  // True when this brand reached out directly rather than the creator
  // applying — same underlying Interest row, but "Withdraw interest" would
  // be a lie if the creator never expressed any.
  contactedByStartup: boolean;
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
  coverUrl,
  interestId,
  contactedByStartup,
}: Props) {
  const { pending, trigger } = useUndoableAction(async () => {
    await withdrawInterestAction(interestId!);
  });

  if (pending) return null;

  const details = [
    platform && deliverables ? deliverables : `Min. ${minFollowers.toLocaleString("en-US")} followers`,
    postBy ? `Post by ${postBy}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // A row in the Matches group: the request's cover photo, who and what,
  // the budget, then the chat and the way out.
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded bg-paper">
        {coverUrl ? (
          // Served by our own image route; nothing for next/image to do.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Avatar src={companyAvatarUrl} name={companyName} size={32} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-footnote text-neutral-500 dark:text-neutral-400">{companyName}</p>
        <h3 className="line-clamp-2 font-bold leading-snug">{title}</h3>
        <p className="truncate text-footnote text-neutral-500 dark:text-neutral-400">
          {budget && <span className="font-bold text-ink">{budget}</span>}
          {budget && details ? " · " : ""}
          {details}
        </p>
        {interestId ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href={`/dashboard/messages/${interestId}`}
              className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper transition hover:bg-graphite"
            >
              Message
            </Link>
            <button
              type="button"
              onClick={() =>
                contactedByStartup
                  ? trigger("Declined.", "Restored.")
                  : trigger("Interest withdrawn.", "Interest restored.")
              }
              className="text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400"
            >
              {contactedByStartup ? "Decline" : "Withdraw interest"}
            </button>
            {contactedByStartup && (
              <p className="w-full text-footnote text-neutral-500 dark:text-neutral-400">{companyName} reached out to you.</p>
            )}
          </div>
        ) : (
          <ActionButton
            action={expressInterestAction.bind(null, id)}
            successMessage="Interest sent."
            className="mt-2 self-start rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
          >
            I&apos;m interested
          </ActionButton>
        )}
      </div>
    </div>
  );
}
