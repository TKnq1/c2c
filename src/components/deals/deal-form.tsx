"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";
import type { DealActionState } from "@/lib/deals/action-state";
import { useDealText } from "@/components/deals/use-deal-text";
import { IssueList, primaryButton, secondaryButton } from "@/components/deals/ui";

type Result = NonNullable<DealActionState> | undefined;
type FormAction<S extends Result> = (prev: S, formData: FormData) => Promise<S>;

// A form whose action answers with findings instead of throwing. onSubmit rather than <form action>, because React resets
// a form after its action ran, which would wipe what the person typed when something has to be fixed. The findings come
// back under the form (and next to the fields that use <Field name=... issues=...>).
export function DealForm<S extends Result = DealActionState>({
  action,
  successMessage,
  submitLabel,
  className = "flex flex-col gap-3",
  resetOnSuccess = false,
  hideSubmit = false,
  hideFindings = false,
  augment,
  onDone,
  extra,
  children,
}: {
  action: FormAction<S>;
  successMessage: string;
  submitLabel: string;
  className?: string;
  resetOnSuccess?: boolean;
  // The form brings its own submit buttons (name="decision" value="APPROVE", ...).
  hideSubmit?: boolean;
  // The form lists its findings itself (the briefing builder checks live), so they are not repeated under it.
  hideFindings?: boolean;
  // Adds what the DOM cannot give: a resized image, a value computed from several fields.
  augment?: (formData: FormData) => void;
  onDone?: (result: S) => void;
  extra?: React.ReactNode;
  children: (state: S | undefined, pending: boolean) => React.ReactNode;
}) {
  const u = useDealText();
  const router = useRouter();
  const [state, setState] = useState<S | undefined>(undefined);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  // Findings that belong to a field are already written under that field (see <Field issues=...>): the list under the
  // form keeps the rest, so nothing is said twice and nothing a field cannot show is lost.
  const [inline, setInline] = useState<ReadonlySet<string>>(new Set());
  useLayoutEffect(() => {
    const names = formRef.current?.querySelectorAll<HTMLElement>("[data-issue-field]") ?? [];
    setInline(new Set(Array.from(names, (el) => el.dataset.issueField!)));
  }, [state]);

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        // The button that was pressed goes along (its name and value), which a plain FormData(form) leaves out.
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
        const formData = new FormData(form, submitter);
        augment?.(formData);
        startTransition(async () => {
          let result: S;
          try {
            result = await action(undefined as unknown as S, formData);
          } catch (err) {
            result = { error: errorMessage(err) } as S;
          }
          setState(result);
          if (result?.success) {
            toast.success(successMessage);
            if (resetOnSuccess) form.reset();
            onDone?.(result);
            router.refresh();
          }
        });
      }}
    >
      {children(state, pending)}
      {!hideFindings && state && !state.success && state.error && !(state.issues && state.issues.length > 0) && (
        <p className="text-sm font-medium text-ink" role="alert">
          {state.error}
        </p>
      )}
      {!hideFindings && <IssueList issues={state?.issues?.filter((i) => !(i.field && inline.has(i.field)))} />}
      {state?.fixHref && (
        <Link href={state.fixHref} className="text-sm font-medium underline">
          {u("form.fixBusiness")}
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {!hideSubmit && (
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? u("form.working") : submitLabel}
          </button>
        )}
        {extra}
      </div>
    </form>
  );
}

// A button for an action that answers with a state: sign, confirm, cancel, check again.
export function DealActionButton({
  action,
  label,
  successMessage,
  confirmMessage,
  variant = "primary",
  className,
}: {
  action: () => Promise<DealActionState>;
  label: string;
  successMessage: string;
  confirmMessage?: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const u = useDealText();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fixHref, setFixHref] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={className ?? (variant === "primary" ? primaryButton : secondaryButton)}
        onClick={() => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          setProblem(null);
          setFixHref(null);
          startTransition(async () => {
            let result: DealActionState;
            try {
              result = await action();
            } catch (err) {
              result = { error: errorMessage(err) };
            }
            if (result?.success) {
              toast.success(successMessage);
              router.refresh();
            } else {
              setProblem(result?.error ?? u("form.somethingWrong"));
              setFixHref(result?.fixHref ?? null);
              toast.error(result?.error ?? u("form.somethingWrong"));
            }
          });
        }}
      >
        {pending ? u("form.working") : label}
      </button>
      {problem && <p className="text-sm font-medium text-ink">{problem}</p>}
      {fixHref && (
        <Link href={fixHref} className="text-sm font-medium underline">
          {u("form.fixBusiness")}
        </Link>
      )}
    </div>
  );
}
