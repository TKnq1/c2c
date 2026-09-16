"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Keeps a set of named filter values in sync with the URL's query string,
 * so filters survive back-navigation and a filtered view is shareable. Uses
 * `replace` (not `push`) so every keystroke doesn't pile onto browser
 * history — back still lands on the previous page, not a filter history.
 * Empty values are omitted from the URL entirely, keeping it clean.
 */
export function useUrlState(keys: string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = Object.fromEntries(keys.map((k) => [k, searchParams.get(k) ?? ""]));

  // Applies every update against one URLSearchParams snapshot, then issues a
  // single replace. setValue is defined in terms of this so that calling it
  // more than once per event (e.g. clearing several filters at once) can't
  // have each call clobber the previous one's change with a stale snapshot.
  const setValues = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setValue = useCallback((key: string, value: string) => setValues({ [key]: value }), [setValues]);

  return [values, setValue, setValues] as const;
}
