import type { CampaignBriefing, Prisma } from "@prisma/client";
import type { BriefingInput } from "@/lib/compliance/briefing";
import { validateBriefing } from "@/lib/compliance/briefing";
import { errorsOf, type Issue } from "@/lib/deals/issues";
import { briefingRowToInput, buildTerms, defaultBriefingFor, termsHash, type BriefingRow } from "@/lib/deals/terms";

type RequestWithBriefing = {
  id: string;
  title: string;
  productCategory: string;
  deliverables: string | null;
  platform: string | null;
  postBy: Date | null;
  budgetMaxCents: number | null;
  briefing: CampaignBriefing | null;
};

// The campaign rules a deal will be made under: the brand's briefing, or the German defaults derived from the request
// when it was written before briefings existed.
export function briefingInputFor(request: Pick<RequestWithBriefing, "platform" | "postBy" | "briefing">): BriefingInput {
  return request.briefing ? briefingRowToInput(request.briefing as BriefingRow) : defaultBriefingFor(request);
}

// What keeps an offer from being made or accepted: only errors count, warnings are the brand's to read.
export function briefingBlockers(request: RequestWithBriefing, now = new Date()): Issue[] {
  return errorsOf(validateBriefing(briefingInputFor(request), { budgetMaxCents: request.budgetMaxCents, now }));
}

type AcceptedInterest = {
  id: string;
  creatorId: string;
  amountCents: number | null;
  payoutCents: number | null;
  platformFeeCents: number | null;
  request: RequestWithBriefing & { startupId: string; startup: { companyName: string } };
  creator: { displayName: string };
};

// Called inside the transaction that accepts the offer, so an accepted offer and its deal exist together or not at all.
export async function createDealInTx(tx: Prisma.TransactionClient, interest: AcceptedInterest) {
  if (interest.amountCents === null || interest.payoutCents === null || interest.platformFeeCents === null) {
    throw new Error("The offer has no amount.");
  }
  const terms = buildTerms({
    request: interest.request,
    briefing: briefingInputFor(interest.request),
    brandName: interest.request.startup.companyName,
    creatorName: interest.creator.displayName,
    amountCents: interest.amountCents,
    payoutCents: interest.payoutCents,
    platformFeeCents: interest.platformFeeCents,
  });
  const deal = await tx.deal.create({
    data: {
      interestId: interest.id,
      startupId: interest.request.startupId,
      creatorId: interest.creatorId,
      terms: terms as unknown as Prisma.InputJsonValue,
      termsHash: termsHash(terms),
    },
  });
  await tx.dealEvent.create({
    data: { dealId: deal.id, kind: "deal.created", toStatus: "CONTRACT_PENDING", data: { termsHash: deal.termsHash } },
  });
  return deal;
}
