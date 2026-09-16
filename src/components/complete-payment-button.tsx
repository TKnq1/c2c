"use client";

import { useState } from "react";
import { createCheckoutSessionAction } from "@/lib/actions/payments";

export function CompletePaymentButton({ interestId, label }: { interestId: string; label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const result = await createCheckoutSessionAction(interestId);
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="flex flex-col gap-1 mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 self-start"
      >
        {pending ? "Redirecting…" : label}
      </button>
      {error && <p className="text-sm text-ink">{error}</p>}
    </div>
  );
}
