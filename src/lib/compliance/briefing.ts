import { errorIssue, warningIssue, type Issue } from "@/lib/deals/issues";
import { POST_FORMATS, isPostFormat } from "@/lib/social/platforms";
import {
  MARKET_RULES,
  classifyLabel,
  containsForbiddenDisclosureInstruction,
  isMarket,
  type Market,
} from "@/lib/compliance/disclosure";
import { validateExclusivityTerms, type ExclusivityTerms } from "@/lib/compliance/exclusivity";
import { validateUsageTerms, type UsageTerms } from "@/lib/compliance/usage-rights";

export const MIN_LIVE_HOURS_OPTIONS = [24, 72, 168, 336, 720] as const;

export type BriefingInput = {
  targetMarket: string;
  contentFormats: string[];
  talkingPoints: string | null;
  doNots: string | null;
  requiredHashtags: string[];
  requiredMentions: string[];
  disclosureLabels: string[];
  requirePaidPartnershipLabel: boolean;
  draftRequired: boolean;
  draftDueDaysBeforePost: number;
  brandReviewDays: number;
  maxRevisionRounds: number;
  postingWindowStart: Date | null;
  postingWindowEnd: Date | null;
  minLiveHours: number;
  exclusivity: ExclusivityTerms;
  usage: UsageTerms;
};

const HASHTAG = /^#?[\p{L}\p{N}_]{1,60}$/u;
const MENTION = /^@?[\p{L}\p{N}_.]{1,60}$/u;

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// The briefing builder's gatekeeper. Everything that makes a campaign unlawful or unworkable is an error and stops the
// save; things worth a second look are warnings the brand sees but may keep. `ctx.budgetMaxCents` is the request's top
// budget, which the usage fee has to fit into.
export function validateBriefing(input: BriefingInput, ctx: { budgetMaxCents: number | null; now?: Date }): Issue[] {
  const issues: Issue[] = [];
  const now = ctx.now ?? new Date();

  // Formats
  if (input.contentFormats.length === 0) issues.push(errorIssue("BRIEFING_FORMAT_REQUIRED", "contentFormats"));
  for (const format of input.contentFormats) {
    if (!isPostFormat(format)) issues.push(errorIssue("BRIEFING_FORMAT_UNKNOWN", "contentFormats", { format }));
  }

  // Disclosure: wording for the market, never "#ad" alone, never an instruction to hide it.
  const marketKnown = isMarket(input.targetMarket);
  if (!marketKnown) issues.push(errorIssue("BRIEFING_MARKET_UNKNOWN", "targetMarket", { market: input.targetMarket }));
  const market: Market = marketKnown ? (input.targetMarket as Market) : "DE";

  if (input.disclosureLabels.length === 0) {
    issues.push(errorIssue("DISCLOSURE_LABEL_REQUIRED", "disclosureLabels", { labels: MARKET_RULES[market].accepted.join(" / ") }));
  } else {
    const classes = input.disclosureLabels.map((label) => ({ label, kind: classifyLabel(label, market) }));
    for (const { label, kind } of classes) {
      if (kind === "unknown") issues.push(errorIssue("DISCLOSURE_LABEL_UNKNOWN", "disclosureLabels", { label }));
      if (kind === "insufficient") issues.push(errorIssue("DISCLOSURE_LABEL_INSUFFICIENT", "disclosureLabels", { label }));
    }
  }

  const freeText = [input.talkingPoints, input.doNots, ...input.requiredHashtags, ...input.requiredMentions];
  if (freeText.some((text) => containsForbiddenDisclosureInstruction(text))) {
    issues.push(errorIssue("DISCLOSURE_INSTRUCTION_FORBIDDEN", "doNots"));
  }

  const anyHasPartnershipLabel = input.contentFormats.some((f) => isPostFormat(f) && POST_FORMATS[f].partnershipLabel);
  if (anyHasPartnershipLabel && !input.requirePaidPartnershipLabel && ["DE", "AT", "CH"].includes(market)) {
    issues.push(warningIssue("PAID_PARTNERSHIP_LABEL_RECOMMENDED", "requirePaidPartnershipLabel"));
  }

  for (const tag of input.requiredHashtags) {
    if (!HASHTAG.test(tag)) issues.push(errorIssue("BRIEFING_HASHTAG_INVALID", "requiredHashtags", { tag }));
  }
  for (const mention of input.requiredMentions) {
    if (!MENTION.test(mention)) issues.push(errorIssue("BRIEFING_MENTION_INVALID", "requiredMentions", { mention }));
  }

  // Workflow and dates
  const { postingWindowStart: from, postingWindowEnd: to } = input;
  if (from && to && startOfUtcDay(to) < startOfUtcDay(from)) issues.push(errorIssue("BRIEFING_WINDOW_INVALID", "postingWindowEnd"));
  if (to && startOfUtcDay(to) < startOfUtcDay(now)) issues.push(errorIssue("BRIEFING_WINDOW_PAST", "postingWindowEnd"));
  if (!(MIN_LIVE_HOURS_OPTIONS as readonly number[]).includes(input.minLiveHours)) {
    issues.push(errorIssue("BRIEFING_LIVE_HOURS_INVALID", "minLiveHours"));
  }
  const inRange = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;
  if (
    !inRange(input.draftDueDaysBeforePost, 1, 30) ||
    !inRange(input.brandReviewDays, 1, 14) ||
    !inRange(input.maxRevisionRounds, 0, 5)
  ) {
    issues.push(errorIssue("BRIEFING_WORKFLOW_RANGE", "brandReviewDays"));
  }

  issues.push(...validateExclusivityTerms(input.exclusivity));
  if (input.exclusivity.enabled && input.exclusivity.categories.length === 0 && input.exclusivity.competitors.length === 0) {
    // Not an error: it then means the request's own product category. Said out loud so the brand knows.
    issues.push(warningIssue("EXCLUSIVITY_SCOPE_REQUIRED", "exclusivityCategories"));
  }
  issues.push(...validateUsageTerms(input.usage, { budgetMaxCents: ctx.budgetMaxCents }));

  return issues;
}
