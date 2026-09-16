"use client";

import { useRef, useState } from "react";
import { toast } from "@/lib/toast";

const UNDO_WINDOW_MS = 5000;

/**
 * Optimistically hides an item, then — after a brief undo window — calls
 * the given server action. Clicking "Undo" in the toast within that window
 * cancels it, so nothing is ever sent to the server. The timer isn't tied
 * to this component's lifetime, so it still fires correctly even if the
 * user navigates away before it elapses.
 */
export function useUndoableAction(action: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function trigger(pendingMessage: string, undoneMessage: string) {
    setPending(true);
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      try {
        await action();
      } catch (err) {
        setPending(false);
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    }, UNDO_WINDOW_MS);

    toast.info(pendingMessage, {
      durationMs: UNDO_WINDOW_MS,
      action: {
        label: "Undo",
        onClick: () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
            setPending(false);
            toast.success(undoneMessage);
          }
        },
      },
    });
  }

  return { pending, trigger };
}
