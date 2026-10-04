"use client";

import { useState } from "react";
import Link from "next/link";
import { IoChatbubble } from "react-icons/io5";
import { startConversationAsStartupAction } from "@/lib/actions/requests";
import { Dialog } from "@/components/dialog";
import { useI18n } from "@/components/i18n-provider";

type Props = {
  creatorId: string;
  existingInterestId: string | null;
  openRequests: { id: string; title: string }[];
};

const BUTTON =
  "flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-40 disabled:hover:bg-ink";

// One Message button on a creator's profile. With a single open request it
// starts that conversation straight away; with several, which request it's
// about is asked only after the tap, in a sheet.
export function StartConversationAsStartup({ creatorId, existingInterestId, openRequests }: Props) {
  const { t } = useI18n();
  const [choosing, setChoosing] = useState(false);
  const [pending, setPending] = useState(false);
  const action = startConversationAsStartupAction.bind(null, creatorId);
  const label = (
    <>
      <IoChatbubble className="h-4 w-4" aria-hidden />
      {t("screens.messages.message")}
    </>
  );

  if (existingInterestId) {
    return (
      <Link href={`/dashboard/messages/${existingInterestId}`} className={BUTTON}>
        {label}
      </Link>
    );
  }

  if (openRequests.length === 0) {
    return (
      <Link href="/dashboard/startup/new" className={BUTTON} title={t("screens.ui.alwaysAbout")}>
        <IoChatbubble className="h-4 w-4" aria-hidden />
        {t("screens.ui.postToMessage")}
      </Link>
    );
  }

  if (openRequests.length === 1) {
    return (
      <form action={action} onSubmit={() => setPending(true)} className="flex flex-1">
        <input type="hidden" name="requestId" value={openRequests[0].id} />
        <button type="submit" disabled={pending} className={BUTTON}>
          {label}
        </button>
      </form>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setChoosing(true)} className={BUTTON}>
        {label}
      </button>
      <Dialog open={choosing} onClose={() => setChoosing(false)} title={t("screens.ui.whichRequest")}>
        <form action={action} onSubmit={() => setPending(true)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {openRequests.map((r, i) => (
              <label
                key={r.id}
                className="flex cursor-pointer items-center gap-3 rounded border border-neutral-300 px-4 py-3 text-sm font-medium transition hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-fog dark:border-neutral-700"
              >
                <input type="radio" name="requestId" value={r.id} required defaultChecked={i === 0} className="accent-[var(--ink)]" />
                <span className="min-w-0 truncate">{r.title}</span>
              </label>
            ))}
          </div>
          <button type="submit" disabled={pending} className={BUTTON}>
            {pending ? t("screens.requests.openingChat") : t("screens.ui.startConversation")}
          </button>
        </form>
      </Dialog>
    </>
  );
}
