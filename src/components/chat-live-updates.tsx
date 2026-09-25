"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 4000;

// Keeps an open thread current without a manual reload: while the tab is
// visible it polls the thread's tiny state endpoint, and only re-renders the
// page (router.refresh) when that version moved — a new message, a read
// receipt, an offer change. Fully paused in the background; checks right
// away on coming back to the tab/app.
export function ChatLiveUpdates({ interestId, version }: { interestId: string; version: string }) {
  const router = useRouter();
  const versionRef = useRef(version);

  // A refresh (ours, or a send's own revalidation) renders a new version
  // into the page — adopt it so the next poll doesn't count it as news.
  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let stopped = false;

    const check = async () => {
      if (inFlight || stopped) return;
      inFlight = true;
      try {
        const res = await fetch(`/api/messages/${interestId}/state`, { cache: "no-store" });
        if (res.ok) {
          const data: { version: string } = await res.json();
          if (!stopped && data.version !== versionRef.current) {
            versionRef.current = data.version;
            router.refresh();
          }
        }
      } catch {
        // Offline or a blip — just try again on the next tick.
      } finally {
        inFlight = false;
        schedule();
      }
    };

    const schedule = () => {
      clearTimeout(timer);
      if (!stopped && document.visibilityState === "visible") timer = setTimeout(check, POLL_INTERVAL_MS);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") check();
      else clearTimeout(timer);
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [interestId, router]);

  return null;
}
