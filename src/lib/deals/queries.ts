import type { DealStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { waitingFor } from "@/lib/deals/status";
import { dealsEnabled } from "@/lib/deals/flag";

// What the deal screens read. Selects only what the pages show: never the other side's payment ids or account data.

const partyInclude = {
  interest: {
    select: {
      id: true,
      requestId: true,
      amountCents: true,
      payoutCents: true,
      platformFeeCents: true,
      paymentStatus: true,
      request: { select: { id: true, title: true, startup: { select: { id: true, userId: true, companyName: true, avatarUrl: true } } } },
      creator: { select: { id: true, userId: true, displayName: true, avatarUrl: true, stripeOnboarded: true } },
    },
  },
} as const;

export function dealWhereForUser(userId: string, role: Role) {
  return role === "STARTUP"
    ? { interest: { request: { startup: { userId } } } }
    : { interest: { creator: { userId } } };
}

export async function listDealsForUser(userId: string, role: Role) {
  return prisma.deal.findMany({
    where: dealWhereForUser(userId, role),
    orderBy: { statusChangedAt: "desc" },
    select: {
      id: true,
      status: true,
      statusChangedAt: true,
      brandSignedAt: true,
      creatorSignedAt: true,
      draftDueAt: true,
      draftReviewDueAt: true,
      revisionDueAt: true,
      postWindowEnd: true,
      scheduledFor: true,
      verificationEndsAt: true,
      graceUntil: true,
      brandTotalCents: true,
      terms: true,
      ...partyInclude,
    },
  });
}

export type DealListItem = Awaited<ReturnType<typeof listDealsForUser>>[number];

const OPEN_STATUSES: DealStatus[] = [
  "CONTRACT_PENDING",
  "AWAITING_ESCROW",
  "IN_PRODUCTION",
  "DRAFT_SUBMITTED",
  "CHANGES_REQUESTED",
  "DRAFT_APPROVED",
  "POST_SCHEDULED",
  "POST_SUBMITTED",
  "VERIFYING",
  "REPOST_REQUIRED",
  "PAYOUT_PENDING",
  "DISPUTED",
];

// Whether it is this person's turn on a deal.
export function isMyTurn(deal: Pick<DealListItem, "status" | "brandSignedAt" | "creatorSignedAt">, role: Role): boolean {
  const waiting = waitingFor(deal.status, { brandSigned: deal.brandSignedAt !== null, creatorSigned: deal.creatorSignedAt !== null });
  return waiting.includes(role === "STARTUP" ? "STARTUP" : "CREATOR");
}

// Whether the person has any deal at all.
export async function hasDeals(userId: string, role: Role): Promise<boolean> {
  if (role !== "STARTUP" && role !== "CREATOR") return false;
  return (await prisma.deal.count({ where: dealWhereForUser(userId, role), take: 1 })) > 0;
}

// Whether the Deals screens are open to this person: the feature is on, or they already have deals (which must stay
// reachable when the switch is turned off, see flag.ts).
export async function canUseDeals(userId: string, role: Role): Promise<boolean> {
  return dealsEnabled() || (await hasDeals(userId, role));
}

// For the badge on the Deals tab: deals that wait for this person.
export async function getDealActionCount(userId: string, role: Role): Promise<number> {
  if (role !== "STARTUP" && role !== "CREATOR") return 0;
  const deals = await prisma.deal.findMany({
    where: { ...dealWhereForUser(userId, role), status: { in: OPEN_STATUSES } },
    select: { status: true, brandSignedAt: true, creatorSignedAt: true },
  });
  return deals.filter((d) => isMyTurn(d, role)).length;
}

export async function loadDealPage(dealId: string) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      ...partyInclude,
      drafts: { orderBy: { version: "desc" } },
      posts: {
        orderBy: { submittedAt: "desc" },
        include: {
          proofs: { select: { id: true, kind: true, createdAt: true } },
          metrics: { orderBy: { capturedAt: "desc" }, take: 1 },
        },
      },
      events: { orderBy: { createdAt: "desc" }, take: 60 },
      disputes: { orderBy: { openedAt: "desc" } },
      invoices: {
        orderBy: [{ issuedAt: "asc" }, { revision: "asc" }],
        select: { id: true, number: true, kind: true, status: true, grossCents: true, issuedAt: true, recipientUserId: true, cancelsInvoiceId: true },
      },
    },
  });
}

export type DealPageData = NonNullable<Awaited<ReturnType<typeof loadDealPage>>>;
