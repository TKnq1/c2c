"use client";

import { useEffect } from "react";
import { markNoticesReadAction } from "@/lib/actions/admin-dashboard";

// The page was opened: what was new counts as seen. Not at the very first moment, so the "Neu" marks stay readable for a
// few seconds; and at once if the page is left before that.
export function MarkNoticesRead({ unread }: { unread: number }) {
  useEffect(() => {
    if (unread === 0) return;
    let done = false;
    const markNow = () => {
      if (done) return;
      done = true;
      void markNoticesReadAction();
    };
    const timer = setTimeout(markNow, 4000);
    return () => {
      clearTimeout(timer);
      markNow();
    };
  }, [unread]);
  return null;
}
