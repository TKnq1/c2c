import type { PaymentStatus, DepositStatus, Role } from "@prisma/client";
import { formatCents } from "@/lib/format";
import type { TFunction } from "@/lib/i18n/translate";

// type "offer" marks the current proposal — the chat shows that one as an
// interactive offer card instead of a plain milestone row.
export type TimelineEvent = { at: Date; label: string; href?: string; type?: "offer" };

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
  proofSubmittedAt: Date | null;
  disputedAt: Date | null;
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
export function buildCollabTimeline(interest: TimelineInterest, t: TFunction): TimelineEvent[] {
  const creatorName = interest.creator.displayName;
  const startupName = interest.request.startup.companyName;
  // Neutral wording deliberately: this can be created either by the creator
  // expressing interest, or by the brand reaching out first from Discover.
  const events: TimelineEvent[] = [{ at: interest.createdAt, label: t("screens.messages.started") }];

  if (interest.offeredAt) {
    const proposer = interest.offerRole === "CREATOR" ? creatorName : startupName;
    events.push({
      at: interest.offeredAt,
      label: t("screens.messages.proposed", { name: proposer, amount: formatCents(interest.amountCents!) }),
      type: "offer",
    });
  }
  if (interest.paidAt) {
    events.push({
      at: interest.paidAt,
      label: t("screens.messages.offerAcceptedEscrow", { amount: formatCents(interest.amountCents!) }),
    });
  }
  // Only the latest submission — a corrected link overwrites the time.
  if (interest.proofSubmittedAt) {
    events.push({
      at: interest.proofSubmittedAt,
      label: t("screens.messages.submittedPost", { name: creatorName }),
      href: interest.proofUrl ?? undefined,
    });
  }
  if (interest.disputedAt) {
    events.push({ at: interest.disputedAt, label: t("screens.messages.reportedHold", { name: startupName }) });
  }
  if (interest.releasedAt) {
    events.push({
      at: interest.releasedAt,
      label: t("screens.messages.releasedTo", { name: creatorName, amount: formatCents(interest.payoutCents!) }),
      href: interest.proofUrl ?? undefined,
    });
  }
  if (interest.refundedAt) {
    events.push({
      at: interest.refundedAt,
      label: t("screens.messages.refundedTo", { amount: formatCents(interest.amountCents!), name: startupName }),
    });
  }

  if (interest.depositRequestedAt) {
    events.push({
      at: interest.depositRequestedAt,
      label: t("screens.messages.requestedDeposit", { name: startupName, amount: formatCents(interest.depositCents!) }),
    });
  }
  if (interest.depositPaidAt) {
    events.push({
      at: interest.depositPaidAt,
      label: t("screens.messages.paidDeposit", { name: creatorName, amount: formatCents(interest.depositCents!) }),
    });
  }
  if (interest.depositReleasedAt) {
    events.push({
      at: interest.depositReleasedAt,
      label: t("screens.messages.returnedDeposit", { name: startupName, amount: formatCents(interest.depositCents!) }),
    });
  }
  if (interest.depositForfeitedAt) {
    events.push({
      at: interest.depositForfeitedAt,
      label: t("screens.messages.keptDeposit", { name: startupName, amount: formatCents(interest.depositCents!) }),
    });
  }

  for (const r of interest.reviews) {
    const author = r.authorRole === "CREATOR" ? creatorName : startupName;
    events.push({
      at: r.createdAt,
      label: r.comment
        ? t("screens.messages.leftReviewComment", { name: author, rating: r.rating, comment: r.comment })
        : t("screens.messages.leftReview", { name: author, rating: r.rating }),
    });
  }

  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}
