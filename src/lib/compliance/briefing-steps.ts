import type { Issue } from "@/lib/deals/issues";

// The briefing form in three steps (content, label and deadlines, rights) and which step each field belongs to, so a finding
// can say where it is, and "2 errors" can jump to the first one.

export const BRIEFING_STEPS = ["content", "rules", "rights"] as const;
export type BriefingStep = (typeof BRIEFING_STEPS)[number];

const STEP_OF_FIELD: Record<string, BriefingStep> = {
  targetMarket: "content",
  contentFormats: "content",
  requiredHashtags: "content",
  requiredMentions: "content",
  talkingPoints: "content",
  doNots: "content",

  disclosureLabels: "rules",
  requirePaidPartnershipLabel: "rules",
  draftRequired: "rules",
  draftDueDaysBeforePost: "rules",
  brandReviewDays: "rules",
  maxRevisionRounds: "rules",
  postingWindowStart: "rules",
  postingWindowEnd: "rules",
  minLiveHours: "rules",

  exclusivityEnabled: "rights",
  exclusivityCategories: "rights",
  exclusivityCompetitors: "rights",
  exclusivityDaysBefore: "rights",
  exclusivityDaysAfter: "rights",
  usageType: "rights",
  usageChannels: "rights",
  usageDurationDays: "rights",
  usageFeeEuros: "rights",
  usageTerritory: "rights",
};

// A finding without a field (or with one the form does not know) is shown on the first step.
export function stepOfField(field: string | undefined): BriefingStep {
  return (field && STEP_OF_FIELD[field]) || "content";
}

export function countByStep(issues: Pick<Issue, "field" | "severity">[], severity: Issue["severity"] = "error"): Record<BriefingStep, number> {
  const counts: Record<BriefingStep, number> = { content: 0, rules: 0, rights: 0 };
  for (const issue of issues) if (issue.severity === severity) counts[stepOfField(issue.field)] += 1;
  return counts;
}

// The first error in the order a person fills the form in: step by step, and within a step in the order the findings come.
export function firstError<T extends Pick<Issue, "field" | "severity">>(issues: T[]): { step: BriefingStep; field: string | undefined; issue: T } | null {
  for (const step of BRIEFING_STEPS) {
    const found = issues.find((i) => i.severity === "error" && stepOfField(i.field) === step);
    if (found) return { step, field: found.field, issue: found };
  }
  return null;
}
