"use client";

import { useState } from "react";
import Link from "next/link";
import { IoChatbubble } from "react-icons/io5";
import { startConversationAsCreatorAction } from "@/lib/actions/requests";

type Props = {
  existingInterestId: string | null;
  matchingRequests: { id: string; title: string }[];
};

// The Message button on a brand's profile, next to the favorite star. Same
// chat-bubble glyph as the Messages tab (see TAB_ICONS in nav.tsx).
const BUTTON =
  "flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-40 disabled:hover:bg-ink";

export function StartConversationAsCreator({ existingInterestId, matchingRequests }: Props) {
  const [pending, setPending] = useState(false);

  if (existingInterestId) {
    return (
      <Link href={`/dashboard/messages/${existingInterestId}`} className={BUTTON}>
        <IoChatbubble className="h-4 w-4" aria-hidden />
        Message
      </Link>
    );
  }

  // Shown dimmed rather than left out, so it reads as "not available yet";
  // the page says why underneath.
  if (matchingRequests.length === 0) {
    return (
      <button type="button" disabled className={BUTTON}>
        <IoChatbubble className="h-4 w-4" aria-hidden />
        Message
      </button>
    );
  }

  // About the first match; the others can be messaged about from their own
  // sheet under Open requests (see BrandRequestList).
  return (
    <form action={startConversationAsCreatorAction} onSubmit={() => setPending(true)} className="flex flex-1">
      <input type="hidden" name="requestId" value={matchingRequests[0].id} />
      <button type="submit" disabled={pending} className={BUTTON}>
        <IoChatbubble className="h-4 w-4" aria-hidden />
        Message
      </button>
    </form>
  );
}
