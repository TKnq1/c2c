import type { PaymentStatus, DepositStatus, Role } from "@prisma/client";
import { formatCents } from "@/lib/format";

export type TimelineEvent = { at: Date; label: string; href?: string };

type TimelineInterest = {
  createdAt: Date;
  amountCents: number | null;
  payoutCents: number | null;
  paymentStatus: PaymentStatus | null;
  offerRole: Role | null;
  offeredAt: Date | null;
  paidAt: Date | null;
  releasedAt: Date | null;
  refundedAt: Date | null;
  proofUrl: string | null;
  depositCents: number | null;
  depositStatus: DepositStatus | null;
  depositRequestedAt: Date | null;
  depositPaidAt: Date | null;
  depositReleasedAt: Date | null;
  depositForfeitedAt: Date | null;
  creator: { displayName: string };
  request: { startup: { companyName: string } };
  reviews: { authorRole: Role; rating: number; comment: string | null; createdAt: Date }[];
};

// Synthesizes a chronological log from the interest's own state timestamps
// (there's no separate append-only event table) — reflects the milestones
// that actually happened, not a full round-by-round negotiation transcript,
// since each new offer/counter overwrites the previous one's fields.
export function buildCollabTimeline(interest: TimelineInterest): TimelineEvent[] {
  const creatorName = interest.creator.displayName;
  const startupName = interest.request.startup.companyName;
  // Neutral wording deliberately: this can be created either by the creator
  // expressing interest, or by the brand reaching out first from Discover.
  const events: TimelineEvent[] = [{ at: interest.createdAt, label: "Conversation started" }];

  if (interest.offeredAt) {
    const proposer = interest.offerRole === "CREATOR" ? creatorName : startupName;
    events.push({ at: interest.offeredAt, label: `${proposer} proposed ${formatCents(interest.amountCents!)}` });
  }
  if (interest.paidAt) {
    events.push({ at: interest.paidAt, label: `Offer accepted — ${formatCents(interest.amountCents!)} held in escrow` });
  }
  if (interest.releasedAt) {
    events.push({
      at: interest.releasedAt,
      label: `Payment released — ${creatorName} received ${formatCents(interest.payoutCents!)}`,
      href: interest.proofUrl ?? undefined,
    });
  }
  if (interest.refundedAt) {
    events.push({ at: interest.refundedAt, label: `Payment refunded — ${formatCents(interest.amountCents!)} returned to ${startupName}` });
  }

  if (interest.depositRequestedAt) {
    events.push({ at: interest.depositRequestedAt, label: `${startupName} requested a ${formatCents(interest.depositCents!)} deposit` });
  }
  if (interest.depositPaidAt) {
    events.push({ at: interest.depositPaidAt, label: `${creatorName} paid the ${formatCents(interest.depositCents!)} deposit` });
  }
  if (interest.depositReleasedAt) {
    events.push({ at: interest.depositReleasedAt, label: `${startupName} returned the ${formatCents(interest.depositCents!)} deposit` });
  }
  if (interest.depositForfeitedAt) {
    events.push({ at: interest.depositForfeitedAt, label: `${startupName} kept the ${formatCents(interest.depositCents!)} deposit` });
  }

  for (const r of interest.reviews) {
    const author = r.authorRole === "CREATOR" ? creatorName : startupName;
    events.push({
      at: r.createdAt,
      label: `${author} left a ${r.rating}-star review${r.comment ? `: "${r.comment}"` : ""}`,
    });
  }

  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}
