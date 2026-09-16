"use client";

import { useState, useTransition } from "react";
import { toast } from "@/lib/toast";

// Same tuple shape as useActionState ([state, formAction, pending]), but for
// forms whose success can remove or remount the very component holding the
// state (e.g. the row leaves a revalidated list, or a `key` tied to the new
// data changes) — in that case a useEffect on `state` never gets to fire,
// because the component is torn down before/without ever committing a
// render with the new state. Firing the toast inline, right as the action's
// promise resolves, doesn't depend on this component surviving afterward.
export function useToastFormAction<S extends { error?: string; success?: boolean }>(
  action: (prevState: S | undefined, formData: FormData) => Promise<S | undefined>,
  successMessage: string,
) {
  const [state, setState] = useState<S | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  const formAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await action(state, formData);
      setState(result);
      if (result?.success) toast.success(successMessage);
    });
  };

  return [state, formAction, pending] as const;
}
