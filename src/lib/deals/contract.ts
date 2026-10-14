import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { businessReadiness } from "@/lib/tax/business";
import { computeDealTax } from "@/lib/tax/engine";
import { platformIsSmallBusiness } from "@/lib/billing/issuer";
import type { DealLocale } from "@/lib/deals/copy";
import { failure, type DealActionState } from "@/lib/deals/action-state";
import { hasErrors, type Issue } from "@/lib/deals/issues";
import { dealHref, notifyDealParty } from "@/lib/deals/notify";
import { toInvoiceParty, toTaxParty, type TaxSnapshot } from "@/lib/deals/parties";
import { loadDeal, moveDeal } from "@/lib/deals/service";

function prefixIssues(issues: Issue[], prefix: string): Issue[] {
  return issues.map((i) => ({ ...i, field: `${prefix}.${i.field ?? ""}` }));
}

// Both sides have signed: fix the tax treatment and open the escrow step. Called after every signature, so whichever one
// comes second (or a retry after a business detail was fixed) finishes the job.
export async function completeContract(dealId: string, actor: "STARTUP" | "CREATOR", actorUserId: string, locale: DealLocale): Promise<{ done: boolean; refusal?: DealActionState }> {
  const view = await loadDeal(dealId);
  if (!view) return { done: false };
  if (view.deal.status !== "CONTRACT_PENDING") return { done: view.deal.status === "AWAITING_ESCROW" };
  if (!view.deal.brandSignedAt || !view.deal.creatorSignedAt) return { done: false };

  const [brandProfile, creatorProfile] = await Promise.all([
    prisma.businessProfile.findUnique({ where: { userId: view.brandUserId } }),
    prisma.businessProfile.findUnique({ where: { userId: view.creatorUserId } }),
  ]);
  const readiness = [...prefixIssues(businessReadiness(brandProfile, "STARTUP"), "brand"), ...prefixIssues(businessReadiness(creatorProfile, "CREATOR"), "creator")];
  if (hasErrors(readiness) || !brandProfile || !creatorProfile) return { done: false, refusal: failure(readiness, locale, "/dashboard/business") };

  const tax = computeDealTax({
    amountCents: view.terms.amountCents,
    // The payout as it stands now: a side that went Pro since the offer was made has moved it (open-deal-fees.ts).
    payoutCents: view.deal.interest.payoutCents ?? view.terms.payoutCents,
    brand: toTaxParty(brandProfile),
    creator: toTaxParty(creatorProfile),
    platform: { smallBusiness: platformIsSmallBusiness() },
  });
  if (!tax.ok) return { done: false, refusal: failure(tax.issues, locale, "/dashboard/business") };

  const snapshot: TaxSnapshot = {
    version: 1,
    computedAt: new Date().toISOString(),
    tax: tax.value,
    brand: toInvoiceParty(brandProfile),
    creator: toInvoiceParty(creatorProfile),
    brandConsultationNumber: brandProfile.vatIdConsultationNumber,
    creatorConsultationNumber: creatorProfile.vatIdConsultationNumber,
  };
  const moved = await moveDeal(dealId, "SIGN_CONTRACT", actor, {
    actorUserId,
    ctx: { otherPartySigned: true },
    expectedFrom: "CONTRACT_PENDING",
    event: "contract.completed",
    data: {
      taxSnapshot: snapshot as unknown as Prisma.InputJsonValue,
      brandNetCents: tax.value.brand.netCents,
      brandVatCents: tax.value.brand.vatCents,
      brandTotalCents: tax.value.brand.totalCents,
    },
  });
  if (!moved.ok) return { done: moved.reason === "CONFLICT" };

  await notifyDealParty(
    view.brandUserId,
    "escrow_due",
    { title: view.title, amount: formatCents(tax.value.brand.totalCents) },
    dealHref(dealId),
  );
  return { done: true };
}

// Contracts both sides have signed but that could not move on (a business detail was missing or a VAT ID unconfirmed) are
// tried again when one of the parties fixes their details.
export async function completePendingContracts(userId: string, locale: DealLocale): Promise<number> {
  const stuck = await prisma.deal.findMany({
    where: {
      status: "CONTRACT_PENDING",
      brandSignedAt: { not: null },
      creatorSignedAt: { not: null },
      OR: [{ interest: { creator: { userId } } }, { interest: { request: { startup: { userId } } } }],
    },
    select: { id: true, interest: { select: { creator: { select: { userId: true } } } } },
  });
  let completed = 0;
  for (const deal of stuck) {
    const role = deal.interest.creator.userId === userId ? "CREATOR" : "STARTUP";
    if ((await completeContract(deal.id, role, userId, locale)).done) completed += 1;
  }
  return completed;
}
