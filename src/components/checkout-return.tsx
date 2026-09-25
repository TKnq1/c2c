"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

const POLL_MS = 2000;
const GIVE_UP_MS = 30_000;

// Stripe sends the brand back here with ?checkout=success|cancelled, but
// only the webhook (api/webhooks/stripe) actually marks the payment as held
// — and it can land a few seconds after that redirect. So on success this
// confirms with a toast, then keeps refreshing the page while the paid
// offer is still sitting under "To pay" (`waiting`), rather than leaving
// the brand looking at a Pay button for money that already went through.
export function CheckoutReturn({ status, waiting }: { status: string | undefined; waiting: boolean }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);
  const toasted = useRef(false);

  useEffect(() => {
    if (toasted.current || (status !== "success" && status !== "cancelled")) return;
    toasted.current = true;
    if (status === "success") toast.success("Payment complete — it's held in escrow until the creator posts.");
    else toast.info("Payment cancelled — nothing was charged.");
  }, [status]);

  const polling = waiting && !gaveUp;
  useEffect(() => {
    if (polling) {
      const id = setInterval(() => router.refresh(), POLL_MS);
      const stop = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
      return () => {
        clearInterval(id);
        clearTimeout(stop);
      };
    }
    // Done, or nothing to wait for: drop the query so a reload doesn't
    // toast again. Only now — refresh() re-requests the current URL, and
    // the page needs ?interest to know which payment it's waiting on.
    if (status) window.history.replaceState(null, "", window.location.pathname);
  }, [polling, status, router]);

  return null;
}
