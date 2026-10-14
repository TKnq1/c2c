import type { Role } from "@prisma/client";
import type { DealLocale } from "@/lib/deals/copy";
import { nextStep, type NextStep } from "@/lib/deals/next-step";
import type { DealListItem } from "@/lib/deals/queries";
import { parseTerms } from "@/lib/deals/terms";

// The "next step" sentence for a deal as the list query returns it (the deals list and a request's progress line read the same rows).
export function nextStepForListItem(deal: DealListItem, role: Extract<Role, "STARTUP" | "CREATOR">, locale: DealLocale): NextStep {
  const { interest } = deal;
  return nextStep(
    {
      status: deal.status,
      role,
      brandSigned: deal.brandSignedAt !== null,
      creatorSigned: deal.creatorSignedAt !== null,
      draftRequired: parseTerms(deal.terms).workflow.draftRequired,
      brandName: interest.request.startup.companyName,
      creatorName: interest.creator.displayName,
      totalCents: deal.brandTotalCents,
      draftDueAt: deal.draftDueAt,
      draftReviewDueAt: deal.draftReviewDueAt,
      revisionDueAt: deal.revisionDueAt,
      postWindowEnd: deal.postWindowEnd,
      scheduledFor: deal.scheduledFor,
      verificationEndsAt: deal.verificationEndsAt,
      graceUntil: deal.graceUntil,
      proofPending: deal.proofPending,
      payoutBlocked: !interest.creator.stripeOnboarded,
    },
    locale,
  );
}
