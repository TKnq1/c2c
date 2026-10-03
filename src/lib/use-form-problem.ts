"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// When the browser refuses to submit a form (a required field is empty, a
// link isn't a URL), it shows a small bubble on that field and nothing else.
// It's easy to miss and some phones don't show it at all, so Save looks like
// it does nothing. This puts the same reason, with the field's name, into
// the form itself: attach `formRef` to the <form>, render `problem`, and
// call `clearProblem` from the form's onChange and onSubmit.
//
// The native listeners below only record the problem; they must not set
// state on `input`/`change` — a re-render ahead of React's own handler would
// put a controlled field back to its old value before it reads what was typed.
export function useFormProblem() {
  const formRef = useRef<HTMLFormElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // `invalid` fires once per bad field, in document order, on every blocked
  // attempt; only the first of an attempt (the field the browser scrolls to)
  // is reported.
  const reported = useRef(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const onClick = (event: Event) => {
      if ((event.target as HTMLElement).closest("button[type=submit]")) reported.current = false;
    };
    // `invalid` doesn't bubble, hence capture.
    const onInvalid = (event: Event) => {
      if (reported.current) return;
      reported.current = true;
      const el = event.target as HTMLInputElement;
      const label = el.getAttribute("aria-label") ?? el.labels?.[0]?.textContent?.trim() ?? el.name;
      setProblem(`${label}: ${el.validationMessage}`);
    };

    form.addEventListener("click", onClick, true);
    form.addEventListener("invalid", onInvalid, true);
    return () => {
      form.removeEventListener("click", onClick, true);
      form.removeEventListener("invalid", onInvalid, true);
    };
  }, []);

  const clearProblem = useCallback(() => setProblem(null), []);

  return { formRef, problem, clearProblem };
}
