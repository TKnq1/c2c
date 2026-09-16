"use client";

import { useEffect } from "react";
import { markThreadReadAction } from "@/lib/actions/messages";

// Fires once a thread has mounted, so opening it clears that thread's unread
// state in the inbox for the next visit, without blocking this page's render.
export function MarkThreadRead({ interestId }: { interestId: string }) {
  useEffect(() => {
    markThreadReadAction(interestId);
  }, [interestId]);

  return null;
}
