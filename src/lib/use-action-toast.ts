"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

// `state` is a fresh object reference every time useActionState resolves
// (even across two successes in a row), so depending on it re-fires this
// correctly on every submission instead of only the first.
export function useActionToast(state: { success?: boolean } | undefined, message: string) {
  useEffect(() => {
    if (state?.success) toast.success(message);
  }, [state, message]);
}
