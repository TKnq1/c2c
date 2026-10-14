import { describe, expect, it } from "vitest";
import { DAY_MS, HOUR_MS } from "@/lib/deals/policy";
import { computeDeadlines, planDealActions, postDeadline, type DealSnapshot } from "@/lib/deals/deadlines";
import type { DealTerms } from "@/lib/deals/terms";

const FUNDED = new Date("2026-10-01T10:00:00Z");

function terms(workflow: Partial<DealTerms["workflow"]> = {}): DealTerms {
  return {
    version: 1,
    requestId: "r1",
    requestTitle: "Autumn launch",
    brandName: "Glow",
    creatorName: "Mia",
    productCategory: "Cosmetics",
    deliverables: "1 Reel",
    amountCents: 100_000,
    payoutCents: 90_000,
    platformFeeCents: 10_000,
    targetMarket: "DE",
    contentFormats: ["INSTAGRAM_REEL"],
    talkingPoints: null,
    doNots: null,
    requiredHashtags: [],
    requiredMentions: [],
    disclosure: { labels: ["Werbung"], requirePaidPartnershipLabel: true },
    workflow: {
      draftRequired: true,
      draftDueDaysBeforePost: 5,
      brandReviewDays: 3,
      maxRevisionRounds: 2,
      postingWindowStart: null,
      postingWindowEnd: "2026-10-20",
      minLiveHours: 24,
      ...workflow,
    },
    exclusivity: { enabled: false, categories: [], competitors: [], daysBefore: 0, daysAfter: 0 },
    usage: { type: "ORGANIC_ONLY", channels: [], durationDays: null, feeCents: null, territory: "EU" },
  };
}

function snapshot(partial: Partial<DealSnapshot>): DealSnapshot {
  return {
    id: "d1",
    status: "IN_PRODUCTION",
    statusChangedAt: FUNDED,
    draftDueAt: null,
    draftReviewDueAt: null,
    revisionDueAt: null,
    postWindowEnd: null,
    draftApprovedAt: null,
    scheduledFor: null,
    graceUntil: null,
    verificationEndsAt: null,
    usageExpiresAt: null,
    remindersSent: [],
    draftRequired: true,
    ...partial,
  };
}

describe("computeDeadlines", () => {
  it("ends the posting window at the end of the briefed day and puts the draft before it", () => {
    const d = computeDeadlines(terms(), FUNDED);
    expect(d.postWindowEnd.toISOString()).toBe("2026-10-20T23:59:59.999Z");
    expect(d.draftDueAt?.getTime()).toBe(d.postWindowEnd.getTime() - 5 * DAY_MS);
  });

  it("gives a flexible request 30 days after funding", () => {
    const d = computeDeadlines(terms({ postingWindowEnd: null }), FUNDED);
    expect(d.postWindowEnd.getTime()).toBe(FUNDED.getTime() + 30 * DAY_MS);
  });

  it("never asks for the draft sooner than 48 hours after funding", () => {
    const d = computeDeadlines(terms({ postingWindowEnd: "2026-10-03" }), FUNDED);
    expect(d.draftDueAt?.getTime()).toBe(FUNDED.getTime() + 48 * HOUR_MS);
  });

  it("has no draft deadline when no draft is required", () => {
    expect(computeDeadlines(terms({ draftRequired: false }), FUNDED).draftDueAt).toBeNull();
  });

  it("starts the window at the briefed day, or at funding when that day is earlier", () => {
    expect(computeDeadlines(terms({ postingWindowStart: "2026-10-10" }), FUNDED).postWindowStart.toISOString()).toBe("2026-10-10T00:00:00.000Z");
  });
});

describe("postDeadline", () => {
  it("leaves the creator at least 48 hours after a late approval", () => {
    const end = new Date("2026-10-20T23:59:59Z");
    const approved = new Date("2026-10-20T12:00:00Z");
    expect(postDeadline(end, approved).getTime()).toBe(approved.getTime() + 48 * HOUR_MS);
    expect(postDeadline(end, new Date("2026-10-10T00:00:00Z"))).toEqual(end);
    expect(postDeadline(end, null)).toEqual(end);
  });
});

describe("planDealActions", () => {
  const at = (iso: string) => new Date(iso);

  it("lets an unsigned contract and an unpaid escrow lapse after seven days without refund", () => {
    const old = new Date(FUNDED.getTime() - 8 * DAY_MS);
    expect(planDealActions([snapshot({ status: "CONTRACT_PENDING", statusChangedAt: old })], FUNDED)).toEqual([
      { kind: "CANCEL", dealId: "d1", reason: "CONTRACT_EXPIRED", refund: false },
    ]);
    expect(planDealActions([snapshot({ status: "AWAITING_ESCROW", statusChangedAt: old })], FUNDED)).toEqual([
      { kind: "CANCEL", dealId: "d1", reason: "ESCROW_EXPIRED", refund: false },
    ]);
    expect(planDealActions([snapshot({ status: "AWAITING_ESCROW", statusChangedAt: new Date(FUNDED.getTime() - 2 * DAY_MS) })], FUNDED)).toEqual([]);
  });

  it("reminds about a missed draft, then cancels and refunds after the grace period", () => {
    const due = at("2026-10-10T00:00:00Z");
    const deal = snapshot({ draftDueAt: due, postWindowEnd: at("2026-10-30T00:00:00Z") });
    expect(planDealActions([deal], at("2026-10-09T00:00:00Z"))).toEqual([]);
    expect(planDealActions([deal], at("2026-10-10T08:00:00Z"))).toEqual([{ kind: "REMIND", dealId: "d1", reminder: "draft_due" }]);
    expect(planDealActions([{ ...deal, remindersSent: ["draft_due"] }], at("2026-10-10T08:00:00Z"))).toEqual([]);
    expect(planDealActions([deal], at("2026-10-13T01:00:00Z"))).toEqual([
      { kind: "CANCEL", dealId: "d1", reason: "DRAFT_DEADLINE_MISSED", refund: true },
    ]);
  });

  it("treats a brand that does not answer as approving the draft", () => {
    const review = at("2026-10-10T00:00:00Z");
    const deal = snapshot({ status: "DRAFT_SUBMITTED", draftReviewDueAt: review });
    expect(planDealActions([deal], at("2026-10-09T12:00:00Z"))).toEqual([{ kind: "REMIND", dealId: "d1", reminder: "review_due" }]);
    expect(planDealActions([deal], at("2026-10-10T00:00:01Z"))).toEqual([{ kind: "AUTO_APPROVE_DRAFT", dealId: "d1" }]);
    expect(planDealActions([deal], at("2026-10-05T00:00:00Z"))).toEqual([]);
  });

  it("cancels when the changes the brand asked for never arrive", () => {
    const deal = snapshot({ status: "CHANGES_REQUESTED", revisionDueAt: at("2026-10-10T00:00:00Z") });
    expect(planDealActions([deal], at("2026-10-10T06:00:00Z"))).toEqual([{ kind: "REMIND", dealId: "d1", reminder: "revision_due" }]);
    expect(planDealActions([deal], at("2026-10-12T06:00:00Z"))).toEqual([
      { kind: "CANCEL", dealId: "d1", reason: "REVISION_DEADLINE_MISSED", refund: true },
    ]);
  });

  it("cancels and refunds when the posting window passes without a post, after 48 hours of grace", () => {
    const deal = snapshot({ status: "POST_SCHEDULED", postWindowEnd: at("2026-10-20T23:59:59Z"), scheduledFor: at("2026-10-19T10:00:00Z") });
    expect(planDealActions([deal], at("2026-10-19T12:00:00Z"))).toEqual([]);
    expect(planDealActions([deal], at("2026-10-21T10:00:00Z"))).toEqual([{ kind: "REMIND", dealId: "d1", reminder: "post_due" }]);
    expect(planDealActions([deal], at("2026-10-23T00:00:00Z"))).toEqual([
      { kind: "CANCEL", dealId: "d1", reason: "POST_DEADLINE_MISSED", refund: true },
    ]);
  });

  it("reminds once when a scheduled date passes with the window still open", () => {
    const deal = snapshot({ status: "POST_SCHEDULED", postWindowEnd: at("2026-10-30T00:00:00Z"), scheduledFor: at("2026-10-19T10:00:00Z") });
    expect(planDealActions([deal], at("2026-10-20T11:00:00Z"))).toEqual([{ kind: "REMIND", dealId: "d1", reminder: "scheduled_missed" }]);
  });

  it("checks posts of submitted and verifying deals, and finishes the window once it is over", () => {
    expect(planDealActions([snapshot({ status: "POST_SUBMITTED" })], FUNDED)).toEqual([{ kind: "VERIFY_POSTS", dealId: "d1" }]);
    const verifying = snapshot({ status: "VERIFYING", verificationEndsAt: at("2026-10-05T00:00:00Z") });
    expect(planDealActions([verifying], at("2026-10-04T00:00:00Z"))).toEqual([{ kind: "VERIFY_POSTS", dealId: "d1" }]);
    expect(planDealActions([verifying], at("2026-10-05T00:00:00Z"))).toEqual([{ kind: "FINISH_WINDOW", dealId: "d1" }]);
  });

  it("freezes a deal whose removed post was not republished in time", () => {
    const deal = snapshot({ status: "REPOST_REQUIRED", graceUntil: at("2026-10-05T00:00:00Z") });
    expect(planDealActions([deal], at("2026-10-04T00:00:00Z"))).toEqual([]);
    expect(planDealActions([deal], at("2026-10-05T00:00:01Z"))).toEqual([{ kind: "OPEN_DISPUTE", dealId: "d1", reason: "POST_REMOVED" }]);
  });

  it("retries a payout that is due, and leaves disputes and finished deals alone", () => {
    expect(planDealActions([snapshot({ status: "PAYOUT_PENDING" })], FUNDED)).toEqual([{ kind: "RETRY_PAYOUT", dealId: "d1" }]);
    expect(planDealActions([snapshot({ status: "DISPUTED" }), snapshot({ status: "CANCELLED" })], FUNDED)).toEqual([]);
  });

  it("warns a week before usage rights lapse and again when they have", () => {
    const completed = snapshot({ status: "COMPLETED", usageExpiresAt: at("2026-11-01T00:00:00Z") });
    expect(planDealActions([completed], at("2026-10-20T00:00:00Z"))).toEqual([]);
    expect(planDealActions([completed], at("2026-10-26T00:00:00Z"))).toEqual([{ kind: "USAGE_NOTICE", dealId: "d1", reminder: "usage_expiring" }]);
    expect(planDealActions([completed], at("2026-11-02T00:00:00Z"))).toEqual([{ kind: "USAGE_NOTICE", dealId: "d1", reminder: "usage_expired" }]);
    expect(planDealActions([{ ...completed, remindersSent: ["usage_expiring", "usage_expired"] }], at("2026-11-02T00:00:00Z"))).toEqual([]);
  });
});
