// What the validators (briefing, draft, post, usage rights, tax) report. They return codes, never sentences: the
// words live in src/lib/deals/copy.ts in German and English, so the same check can answer a German brand in German and
// an English creator in English, and the tests can compare codes.

export const ISSUE_CODES = [
  // Briefing
  "BRIEFING_FORMAT_REQUIRED",
  "BRIEFING_FORMAT_UNKNOWN",
  "BRIEFING_MARKET_UNKNOWN",
  "BRIEFING_HASHTAG_INVALID",
  "BRIEFING_MENTION_INVALID",
  "BRIEFING_WINDOW_INVALID",
  "BRIEFING_WINDOW_PAST",
  "BRIEFING_LIVE_HOURS_INVALID",
  "BRIEFING_WORKFLOW_RANGE",
  // Advertising disclosure
  "DISCLOSURE_LABEL_REQUIRED",
  "DISCLOSURE_LABEL_UNKNOWN",
  "DISCLOSURE_LABEL_INSUFFICIENT",
  "DISCLOSURE_INSTRUCTION_FORBIDDEN",
  "PAID_PARTNERSHIP_LABEL_RECOMMENDED",
  "CAPTION_REQUIRED",
  "DISCLOSURE_LABEL_MISSING",
  "DISCLOSURE_NOT_PROMINENT",
  "DISCLOSURE_LABEL_NOT_AGREED",
  "DISCLOSURE_IN_CONTENT_REQUIRED",
  "PAID_PARTNERSHIP_LABEL_REQUIRED",
  "REQUIRED_HASHTAG_MISSING",
  "REQUIRED_MENTION_MISSING",
  // Exclusivity
  "EXCLUSIVITY_SCOPE_REQUIRED",
  "EXCLUSIVITY_DAYS_REQUIRED",
  "EXCLUSIVITY_DAYS_TOO_LONG",
  "EXCLUSIVITY_CONFLICT_EXISTING",
  "EXCLUSIVITY_CONFLICT_OTHER_DEAL",
  // Usage rights
  "USAGE_CHANNEL_REQUIRED",
  "USAGE_CHANNEL_NOT_ALLOWED",
  "USAGE_DURATION_REQUIRED",
  "USAGE_DURATION_TOO_LONG",
  "USAGE_FEE_REQUIRED",
  "USAGE_FEE_EXCEEDS_BUDGET",
  "USAGE_FEE_UNEXPECTED",
  "SPARK_CODE_REQUIRED",
  "SPARK_CODE_INVALID",
  "SPARK_CODE_EXPIRES_TOO_EARLY",
  "USAGE_PERMISSION_REQUIRED",
  // Post links and proof
  "POST_URL_INVALID",
  "POST_URL_HOST_UNSUPPORTED",
  "POST_URL_SHORT_LINK",
  "POST_URL_FORMAT_MISMATCH",
  "POST_URL_DUPLICATE",
  "POST_PROOF_REQUIRED",
  "POST_PROOF_INVALID",
  "POST_DATE_INVALID",
  // Tax and business data
  "BUSINESS_PROFILE_INCOMPLETE",
  "BUSINESS_TYPE_NOT_ALLOWED",
  "VAT_ID_FORMAT_INVALID",
  "VAT_ID_COUNTRY_MISMATCH",
  "VAT_ID_REQUIRED",
  "VAT_ID_NOT_VERIFIED",
  "TAX_ID_REQUIRED",
  "TRADER_CERTIFICATION_REQUIRED",
  "SELF_BILLING_CONSENT_REQUIRED",
  "PAYOUT_ACCOUNT_REQUIRED",
  "PLATFORM_INVOICE_DATA_MISSING",
] as const;

export type IssueCode = (typeof ISSUE_CODES)[number];

export type IssueSeverity = "error" | "warning";

export type Issue = {
  code: IssueCode;
  severity: IssueSeverity;
  // The form field the problem belongs to, so the UI can put it next to the input.
  field?: string;
  // Values the sentence mentions ("{days}", "{label}").
  params?: Record<string, string | number>;
};

export function issue(code: IssueCode, severity: IssueSeverity, field?: string, params?: Issue["params"]): Issue {
  return { code, severity, ...(field ? { field } : {}), ...(params ? { params } : {}) };
}

export const errorIssue = (code: IssueCode, field?: string, params?: Issue["params"]) => issue(code, "error", field, params);
export const warningIssue = (code: IssueCode, field?: string, params?: Issue["params"]) => issue(code, "warning", field, params);

export function errorsOf(issues: Issue[]): Issue[] {
  return issues.filter((i) => i.severity === "error");
}

export function hasErrors(issues: Issue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
