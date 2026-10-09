import type { Issue, IssueCode, IssueSeverity } from "@/lib/deals/issues";
import { firstErrorMessage, issueMessage, type DealLocale } from "@/lib/deals/copy";

// What a deal action hands back to its form: one sentence for the toast, and every finding with its words and the field
// it belongs to, so the form can mark the inputs. Lives apart from the actions because a "use server" file may only
// export functions.

export type FieldIssue = { code: IssueCode; severity: IssueSeverity; field?: string; message: string };

export type DealActionState =
  | {
      error?: string;
      success?: boolean;
      issues?: FieldIssue[];
      // Set when the action wants the person to fix something elsewhere first: where to go.
      fixHref?: string;
      // A saved briefing changed the rules: this many open offers were made under the old ones and need to be confirmed again.
      staleOffers?: number;
    }
  | undefined;

export function serializeIssues(issues: Issue[], locale: DealLocale): FieldIssue[] {
  return issues.map((i) => ({ code: i.code, severity: i.severity, field: i.field, message: issueMessage(i, locale) }));
}

// A refusal built from validator findings.
export function failure(issues: Issue[], locale: DealLocale, fixHref?: string): DealActionState {
  return { error: firstErrorMessage(issues, locale) ?? undefined, issues: serializeIssues(issues, locale), ...(fixHref ? { fixHref } : {}) };
}

export function say(locale: DealLocale, en: string, de: string): string {
  return locale === "de" ? de : en;
}

// The business-details form also learns what VIES said about the VAT ID.
export type BusinessActionState =
  | (NonNullable<DealActionState> & { vatStatus?: "UNCHECKED" | "VALID" | "INVALID" | "UNAVAILABLE" })
  | undefined;

// What the briefing-template actions hand back: the template they made or changed, or what happened to each request a
// template was applied to.
export type AppliedResult = {
  requestId: string;
  title: string;
  ok: boolean;
  changed?: boolean;
  staleOffers?: number;
  message?: string;
  issues?: FieldIssue[];
};

export type TemplateActionState =
  | (NonNullable<DealActionState> & { templateId?: string; applied?: AppliedResult[] })
  | undefined;
