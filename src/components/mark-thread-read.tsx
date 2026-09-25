"use client";

import { useEffect } from "react";
import { markThreadReadAction } from "@/lib/actions/messages";

// Clears this thread's unread state without blocking the page's render.
// Keyed on the newest unread incoming message, not just the thread, so a
// message that arrives while the thread is open (see ChatLiveUpdates) gets
// marked read too — and nothing fires at all when there's nothing unread.
export function MarkThreadRead({ interestId, latestUnreadId }: { interestId: string; latestUnreadId: string | null }) {
  useEffect(() => {
    if (latestUnreadId) markThreadReadAction(interestId);
  }, [interestId, latestUnreadId]);

  return null;
}
