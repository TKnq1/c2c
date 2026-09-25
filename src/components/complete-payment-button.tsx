"use client";

import { useState } from "react";
import { createCheckoutSessionAction } from "@/lib/actions/payments";

const DEFAULT_BUTTON_CLASS =
  "rounded-full bg-ink text-paper px-4 py-2.5 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 sm:self-start";

export function CompletePaymentButton({
  interestId,
  label,
  className = DEFAULT_BUTTON_CLASS,
}: {
  interestId: string;
  label: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    // A dropped connection rejects rather than returning { error } — without
    // this the button would sit on "Redirecting…" forever.
    const result = await createCheckoutSessionAction(interestId).catch(() => ({
      error: "Couldn't reach the server — check your connection and try again.",
    }));
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="flex flex-col gap-1 mt-2">
      <button type="button" onClick={handleClick} disabled={pending} className={className}>
        {pending ? "Redirecting…" : label}
      </button>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
