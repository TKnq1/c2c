"use client";

import { useLinkStatus } from "next/link";

// Renders inside a <Link>, spins only once that specific link's navigation
// is both underway and has taken long enough to be worth mentioning (the
// 150ms animation-delay in globals.css) — a fast/prefetched navigation
// never shows it at all. Fixed size and always mounted so nothing shifts
// layout when it appears; see the "is-pending" rule in globals.css.
export function LinkPendingIndicator() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={`link-pending-indicator ${pending ? "is-pending" : ""}`} />;
}
