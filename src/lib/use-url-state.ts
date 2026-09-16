"use client";

import { useCallback, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Every filter/search keystroke used to call router.replace immediately —
// each one is a real server round-trip for a fresh RSC payload, so typing
// felt like it lagged a full request behind every character. Local state
// now updates (and drives client-side filtering) instantly; only the URL
// sync — which exists so filters are shareable/survive back-navigation,
// not for correctness — is debounced.
const DEBOUNCE_MS = 350;

/**
 * Keeps a set of named filter values in sync with the URL's query string,
 * so filters survive back-navigation and a filtered view is shareable. Uses
 * `replace` (not `push`) so filter changes don't pile onto browser history —
 * back still lands on the previous page, not a filter history.
 * Empty values are omitted from the URL entirely, keeping it clean.
 */
export function useUrlState(keys: string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const readFromUrl = useCallback(
    () => Object.fromEntries(keys.map((k) => [k, searchParams.get(k) ?? ""])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParamsString],
  );

  const [values, setValuesState] = useState<Record<string, string>>(readFromUrl);

  // Stays in sync with URL changes from elsewhere (back/forward, a link) —
  // also fires after our own debounced replace() below settles, which is a
  // harmless no-op re-set since the URL already matches by then. Resyncing
  // during render (React's supported pattern for state that must reset
  // when an external value changes) rather than in an effect avoids both a
  // flash of stale values and an extra post-commit render.
  const [syncedParamsString, setSyncedParamsString] = useState(searchParamsString);
  if (searchParamsString !== syncedParamsString) {
    setSyncedParamsString(searchParamsString);
    setValuesState(readFromUrl());
  }

  const commit = useCallback(
    (next: Record<string, string>) => {
      const params = new URLSearchParams(searchParamsString);
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParamsString],
  );

  // Applies every update against the latest local snapshot, then debounces
  // a single replace — so calling this more than once per event (e.g.
  // clearing several filters at once) can't have each call clobber the
  // previous one's change with a stale snapshot.
  const setValues = useCallback(
    (updates: Record<string, string>) => {
      setValuesState((prev) => {
        const next = { ...prev, ...updates };
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => commit(next), DEBOUNCE_MS);
        return next;
      });
    },
    [commit],
  );

  const setValue = useCallback((key: string, value: string) => setValues({ [key]: value }), [setValues]);

  return [values, setValue, setValues] as const;
}
