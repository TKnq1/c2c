"use client";

import Link from "next/link";
import { expressInterestAction, withdrawInterestAction } from "@/lib/actions/requests";
import { Avatar } from "@/components/avatar";
import { ActionButton } from "@/components/action-button";
import { useUndoableAction } from "@/lib/use-undoable-action";

type Props = {
  id: string;
  title: string;
  description: string;
  niche: string;
  languages: string[];
  minFollowers: number;
  productCategory: string;
  companyName: string;
  companyAvatarUrl: string | null;
  interestId: string | null;
  // True when this brand reached out directly rather than the creator
  // applying — same underlying Interest row, but "Withdraw interest" would
  // be a lie if the creator never expressed any.
  contactedByStartup: boolean;
};

export function RequestCard({
  id,
  title,
  description,
  niche,
  languages,
  minFollowers,
  productCategory,
  companyName,
  companyAvatarUrl,
  interestId,
  contactedByStartup,
}: Props) {
  const { pending, trigger } = useUndoableAction(async () => {
    await withdrawInterestAction(interestId!);
  });

  if (pending) return null;

  return (
    <div className="rounded-2xl border border-ink/10 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={companyAvatarUrl} name={companyName} size={36} />
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{companyName}</p>
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
        </div>
        <span className="text-xs rounded bg-fog text-neutral-700 px-3 py-1 whitespace-nowrap dark:text-neutral-300">
          {niche}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="rounded border border-ink/10 px-2 py-1">
          Min. {minFollowers.toLocaleString("en-US")} followers
        </span>
        <span className="rounded border border-ink/10 px-2 py-1">{productCategory}</span>
        {languages.map((l) => (
          <span key={l} className="rounded border border-ink/10 px-2 py-1">
            {l}
          </span>
        ))}
      </div>
      {interestId ? (
        <div className="flex flex-col gap-1.5 items-start">
          {contactedByStartup && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{companyName} reached out to you.</p>
          )}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/messages/${interestId}`}
              className="mt-1 rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition self-start"
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
              className="mt-1 rounded border border-neutral-300 text-neutral-600 px-4 py-2 text-sm font-medium hover:border-ink hover:bg-fog transition self-start dark:border-neutral-700 dark:text-neutral-400"
            >
              {contactedByStartup ? "Decline" : "Withdraw interest"}
            </button>
          </div>
        </div>
      ) : (
        <ActionButton
          action={expressInterestAction.bind(null, id)}
          successMessage="Interest sent."
          className="mt-1 rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition self-start disabled:opacity-50"
        >
          I&apos;m interested
        </ActionButton>
      )}
    </div>
  );
}
