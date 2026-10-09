import { describe, expect, it } from "vitest";
import type { DealStatus } from "@prisma/client";
import { nextStep, type NextStepInput } from "@/lib/deals/next-step";

const base: NextStepInput = {
  status: "IN_PRODUCTION",
  role: "CREATOR",
  brandSigned: true,
  creatorSigned: true,
  draftRequired: true,
  brandName: "Glow",
  creatorName: "Mia",
  totalCents: 119_000,
  draftDueAt: new Date("2026-10-10T12:00:00Z"),
  draftReviewDueAt: null,
  revisionDueAt: null,
  postWindowEnd: new Date("2026-10-20T12:00:00Z"),
  scheduledFor: null,
  verificationEndsAt: null,
  graceUntil: null,
  proofPending: false,
  payoutBlocked: false,
};

const step = (partial: Partial<NextStepInput>) => nextStep({ ...base, ...partial }, "en");

describe("nextStep", () => {
  it("asks whoever has not signed to sign, and the other to wait", () => {
    expect(step({ status: "CONTRACT_PENDING", creatorSigned: false })).toMatchObject({ key: "next.contract.sign", mine: true });
    expect(step({ status: "CONTRACT_PENDING", creatorSigned: true, brandSigned: false })).toMatchObject({ key: "next.contract.waiting", mine: false });
    expect(step({ status: "CONTRACT_PENDING", role: "STARTUP", brandSigned: false })).toMatchObject({ key: "next.contract.sign", mine: true });
  });

  it("asks both sides to continue when both signed but the tax treatment is still open", () => {
    expect(step({ status: "CONTRACT_PENDING", brandSigned: true, creatorSigned: true })).toMatchObject({ key: "next.contract.stuck", mine: true });
    expect(step({ status: "CONTRACT_PENDING", brandSigned: true, creatorSigned: true, role: "STARTUP" })).toMatchObject({ key: "next.contract.stuck", mine: true });
  });

  it("asks the brand to pay the total including VAT", () => {
    const brand = step({ status: "AWAITING_ESCROW", role: "STARTUP" });
    expect(brand).toMatchObject({ key: "next.escrow.pay", mine: true });
    expect(brand.vars.amount).toContain("1.190,00");
    expect(step({ status: "AWAITING_ESCROW" })).toMatchObject({ key: "next.escrow.waiting", mine: false });
  });

  it("tells the creator to deliver a draft, or the post when there is no draft stage", () => {
    expect(step({})).toMatchObject({ key: "next.production.draft", mine: true });
    expect(step({ draftRequired: false })).toMatchObject({ key: "next.production.post", mine: true });
    expect(step({ role: "STARTUP" })).toMatchObject({ key: "next.production.brand", mine: false });
  });

  it("puts the review on the brand and the waiting on the creator", () => {
    expect(step({ status: "DRAFT_SUBMITTED", role: "STARTUP" })).toMatchObject({ key: "next.draft.review", mine: true });
    expect(step({ status: "DRAFT_SUBMITTED" })).toMatchObject({ key: "next.draft.waiting", mine: false });
  });

  it("asks the brand to confirm a post that came with proof only", () => {
    expect(step({ status: "POST_SUBMITTED", role: "STARTUP", proofPending: true })).toMatchObject({ key: "next.submittedProof.brand", mine: true });
    expect(step({ status: "POST_SUBMITTED", role: "STARTUP" })).toMatchObject({ key: "next.submitted.brand", mine: false });
  });

  it("points a creator without a payout account at the setup", () => {
    expect(step({ status: "PAYOUT_PENDING", payoutBlocked: true })).toMatchObject({ key: "next.payoutBlocked", mine: true });
    expect(step({ status: "PAYOUT_PENDING", role: "STARTUP", payoutBlocked: true })).toMatchObject({ key: "next.payout", mine: false });
  });

  it("has a sentence for every status and role", () => {
    const statuses: DealStatus[] = [
      "CONTRACT_PENDING", "AWAITING_ESCROW", "IN_PRODUCTION", "DRAFT_SUBMITTED", "CHANGES_REQUESTED", "DRAFT_APPROVED",
      "POST_SCHEDULED", "POST_SUBMITTED", "VERIFYING", "REPOST_REQUIRED", "PAYOUT_PENDING", "COMPLETED", "DISPUTED", "CANCELLED",
    ];
    for (const status of statuses) {
      for (const role of ["STARTUP", "CREATOR"] as const) {
        expect(step({ status, role }).key, `${status}/${role}`).toMatch(/^next\./);
      }
    }
  });
});
