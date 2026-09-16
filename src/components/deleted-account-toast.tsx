"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

// Reads the query param directly (not useSearchParams) so this doesn't need
// its own Suspense boundary just for a one-shot toast.
export function DeletedAccountToast() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("deleted") === "1") {
      toast.info("Account deleted.");
      // Strip the flag so StrictMode's dev-mode double-invoke (and any
      // later refresh) can't fire this a second time.
      url.searchParams.delete("deleted");
      window.history.replaceState({}, "", url);
    }
  }, []);
  return null;
}
