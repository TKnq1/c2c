import type { DealStatus } from "@prisma/client";
import type { UiKey } from "@/lib/deals/ui-copy";
import { formatDealDate } from "@/lib/deals/notices";
import type { DealLocale } from "@/lib/deals/copy";
import { formatCents } from "@/lib/format";

// The one sentence at the top of a deal: what happens next, and whose move it is.

export type NextStepInput = {
  status: DealStatus;
  role: "STARTUP" | "CREATOR";
  brandSigned: boolean;
  creatorSigned: boolean;
  draftRequired: boolean;
  brandName: string;
  creatorName: string;
  totalCents: number | null;
  draftDueAt: Date | null;
  draftReviewDueAt: Date | null;
  revisionDueAt: Date | null;
  postWindowEnd: Date | null;
  scheduledFor: Date | null;
  verificationEndsAt: Date | null;
  graceUntil: Date | null;
  // A post is waiting for the brand to confirm its proof.
  proofPending: boolean;
  // The deal is due for payout but the creator has no payout account yet.
  payoutBlocked: boolean;
};

export type NextStep = { key: UiKey; vars: Record<string, string | number>; mine: boolean };

export function nextStep(input: NextStepInput, locale: DealLocale): NextStep {
  const d = (date: Date | null) => (date ? formatDealDate(date, locale) : "—");
  const isBrand = input.role === "STARTUP";
  const other = isBrand ? input.creatorName : input.brandName;
  const step = (key: UiKey, mine: boolean, vars: NextStep["vars"] = {}): NextStep => ({ key, vars, mine });

  switch (input.status) {
    case "CONTRACT_PENDING": {
      if (input.brandSigned && input.creatorSigned) return step("next.contract.stuck", true);
      const iSigned = isBrand ? input.brandSigned : input.creatorSigned;
      return iSigned ? step("next.contract.waiting", false, { name: other }) : step("next.contract.sign", true);
    }
    case "AWAITING_ESCROW":
      return isBrand
        ? step("next.escrow.pay", true, { amount: formatCents(input.totalCents ?? 0) })
        : step("next.escrow.waiting", false, { name: input.brandName });
    case "IN_PRODUCTION":
      if (isBrand) return step("next.production.brand", false, { name: input.creatorName });
      return input.draftRequired ? step("next.production.draft", true, { date: d(input.draftDueAt) }) : step("next.production.post", true, { date: d(input.postWindowEnd) });
    case "DRAFT_SUBMITTED":
      return isBrand ? step("next.draft.review", true, { date: d(input.draftReviewDueAt) }) : step("next.draft.waiting", false, { name: input.brandName, date: d(input.draftReviewDueAt) });
    case "CHANGES_REQUESTED":
      return isBrand ? step("next.changes.brand", false, { name: input.creatorName }) : step("next.changes.creator", true, { date: d(input.revisionDueAt) });
    case "DRAFT_APPROVED":
      return isBrand ? step("next.approved.brand", false, { name: input.creatorName, date: d(input.postWindowEnd) }) : step("next.approved.creator", true, { date: d(input.postWindowEnd) });
    case "POST_SCHEDULED":
      return isBrand ? step("next.scheduled.brand", false, { date: d(input.scheduledFor) }) : step("next.scheduled.creator", true, { date: d(input.scheduledFor) });
    case "POST_SUBMITTED":
      if (isBrand) return input.proofPending ? step("next.submittedProof.brand", true) : step("next.submitted.brand", false);
      return step("next.submitted.creator", false);
    case "VERIFYING":
      return step("next.verifying", false, { date: d(input.verificationEndsAt) });
    case "REPOST_REQUIRED":
      return isBrand ? step("next.repost.brand", false, { name: input.creatorName, date: d(input.graceUntil) }) : step("next.repost.creator", true, { date: d(input.graceUntil) });
    case "PAYOUT_PENDING":
      return !isBrand && input.payoutBlocked ? step("next.payoutBlocked", true) : step("next.payout", false);
    case "COMPLETED":
      return step("next.completed", false);
    case "DISPUTED":
      return step("next.disputed", false);
    case "CANCELLED":
      return step("next.cancelled", false);
  }
}
