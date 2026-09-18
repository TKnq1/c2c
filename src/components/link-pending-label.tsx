"use client";

import { useLinkStatus } from "next/link";

// Renders a <Link>'s own text label, swapped for the spinner in the exact
// same slot once that link's navigation is both underway and has taken
// long enough to be worth mentioning (the animation-delay in globals.css)
// — not shown beside the label, so a nav bar full of these doesn't widen
// on click. The wrapper is sized by the label text; the spinner is
// absolutely centered on top of it so nothing reflows when it appears.
// The label stays in the DOM (just visibility:hidden) rather than
// unmounting, so the <Link>'s accessible name doesn't flicker.
export function LinkPendingLabel({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className="link-pending-label">
      <span className={pending ? "invisible" : ""}>{label}</span>
      <span aria-hidden className={`link-pending-indicator ${pending ? "is-pending" : ""}`} />
    </span>
  );
}
