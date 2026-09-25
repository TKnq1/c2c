// Everything on an open chat thread the other side (or a payment webhook)
// can change. ChatLiveUpdates compares the page's copy against the state
// API's and only re-renders the page when they differ. Built by this one
// function on both ends so the two strings can't drift apart in format —
// if they ever did, every poll would look like a change and refresh the
// page forever. Message count rather than last-message id on purpose: two
// messages can share a createdAt, and the page (ascending) and the API
// (descending) could then disagree about which one is "last".
export function chatThreadVersion(t: {
  messageCount: number;
  readCount: number;
  paymentStatus: string | null;
  offerRole: string | null;
  amountCents: number | null;
  depositStatus: string | null;
  // The approval step inside HELD — a submitted post (or a resubmitted
  // link) and a reported problem each change the offer card.
  proofSubmittedAt: Date | null;
  disputedAt: Date | null;
  reviewCount: number;
  blocked: boolean;
}): string {
  return [
    t.messageCount,
    t.readCount,
    t.paymentStatus ?? "",
    t.offerRole ?? "",
    t.amountCents ?? "",
    t.depositStatus ?? "",
    t.proofSubmittedAt?.getTime() ?? "",
    t.disputedAt?.getTime() ?? "",
    t.reviewCount,
    t.blocked ? 1 : 0,
  ].join("|");
}
