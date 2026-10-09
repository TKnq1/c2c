import { describe, expect, it } from "vitest";
import type { DealStatus } from "@prisma/client";
import { FUNDED_STATUSES, LIFECYCLE_STAGES, allowedActions, isTerminal, stageOf, transition, waitingFor } from "@/lib/deals/status";

describe("transition", () => {
  it("keeps the contract pending until both sides signed", () => {
    expect(transition("CONTRACT_PENDING", "SIGN_CONTRACT", "CREATOR", { otherPartySigned: false })).toEqual({ ok: true, to: "CONTRACT_PENDING" });
    expect(transition("CONTRACT_PENDING", "SIGN_CONTRACT", "STARTUP", { otherPartySigned: true })).toEqual({ ok: true, to: "AWAITING_ESCROW" });
  });

  it("only lets the system fund the escrow", () => {
    expect(transition("AWAITING_ESCROW", "FUND_ESCROW", "SYSTEM")).toEqual({ ok: true, to: "IN_PRODUCTION" });
    expect(transition("AWAITING_ESCROW", "FUND_ESCROW", "STARTUP")).toEqual({ ok: false, reason: "ACTOR_NOT_ALLOWED" });
  });

  it("walks the happy path from escrow to completed", () => {
    const path: [string, "CREATOR" | "STARTUP" | "SYSTEM"][] = [
      ["SUBMIT_DRAFT", "CREATOR"],
      ["APPROVE_DRAFT", "STARTUP"],
      ["SCHEDULE_POST", "CREATOR"],
      ["SUBMIT_POST", "CREATOR"],
      ["POST_VERIFIED", "SYSTEM"],
      ["WINDOW_ELAPSED", "SYSTEM"],
      ["PAYOUT_RELEASED", "SYSTEM"],
    ];
    let status: DealStatus = "IN_PRODUCTION";
    for (const [action, actor] of path) {
      const result = transition(status, action as Parameters<typeof transition>[1], actor);
      expect(result.ok, `${status} --${action}-->`).toBe(true);
      if (result.ok) status = result.to;
    }
    expect(status).toBe("COMPLETED");
  });

  it("lets a brand request changes and the creator resubmit", () => {
    expect(transition("DRAFT_SUBMITTED", "REQUEST_CHANGES", "STARTUP")).toEqual({ ok: true, to: "CHANGES_REQUESTED" });
    expect(transition("CHANGES_REQUESTED", "SUBMIT_DRAFT", "CREATOR")).toEqual({ ok: true, to: "DRAFT_SUBMITTED" });
  });

  it("does not let the creator approve their own draft or confirm the payout", () => {
    expect(transition("DRAFT_SUBMITTED", "APPROVE_DRAFT", "CREATOR").ok).toBe(false);
    expect(transition("PAYOUT_PENDING", "PAYOUT_RELEASED", "CREATOR").ok).toBe(false);
  });

  it("sends a vanished post back for a repost", () => {
    expect(transition("VERIFYING", "POST_REMOVED", "SYSTEM")).toEqual({ ok: true, to: "REPOST_REQUIRED" });
    expect(transition("REPOST_REQUIRED", "SUBMIT_POST", "CREATOR")).toEqual({ ok: true, to: "POST_SUBMITTED" });
  });

  it("freezes a funded deal on a dispute and lets only an admin settle it", () => {
    expect(transition("VERIFYING", "OPEN_DISPUTE", "STARTUP")).toEqual({ ok: true, to: "DISPUTED" });
    expect(transition("DISPUTED", "RESOLVE_RELEASE", "STARTUP").ok).toBe(false);
    expect(transition("DISPUTED", "RESOLVE_RELEASE", "ADMIN")).toEqual({ ok: true, to: "PAYOUT_PENDING" });
    expect(transition("DISPUTED", "RESOLVE_REFUND", "ADMIN")).toEqual({ ok: true, to: "CANCELLED" });
  });

  it("resumes only to a funded status", () => {
    expect(transition("DISPUTED", "RESOLVE_RESUME", "ADMIN", { resumeTo: "VERIFYING" })).toEqual({ ok: true, to: "VERIFYING" });
    expect(transition("DISPUTED", "RESOLVE_RESUME", "ADMIN").ok).toBe(false);
    expect(transition("DISPUTED", "RESOLVE_RESUME", "ADMIN", { resumeTo: "COMPLETED" }).ok).toBe(false);
    expect(transition("DISPUTED", "RESOLVE_RESUME", "ADMIN", { resumeTo: "CONTRACT_PENDING" }).ok).toBe(false);
  });

  it("allows nothing from the terminal statuses", () => {
    for (const status of ["COMPLETED", "CANCELLED"] as const) {
      expect(isTerminal(status)).toBe(true);
      expect(allowedActions(status, "ADMIN")).toEqual([]);
    }
  });

  it("never lets the creator dispute a payout that is already due", () => {
    expect(transition("PAYOUT_PENDING", "OPEN_DISPUTE", "CREATOR").ok).toBe(false);
    expect(transition("PAYOUT_PENDING", "OPEN_DISPUTE", "STARTUP").ok).toBe(true);
  });

  it("lets the system or an admin, but no party, end an unfinished deal whose money is gone", () => {
    for (const status of ["CONTRACT_PENDING", "AWAITING_ESCROW", "IN_PRODUCTION", "DRAFT_SUBMITTED", "POST_SUBMITTED", "VERIFYING", "PAYOUT_PENDING", "DISPUTED"] as const) {
      expect(transition(status, "FORCE_CANCEL", "SYSTEM")).toEqual({ ok: true, to: "CANCELLED" });
      expect(transition(status, "FORCE_CANCEL", "ADMIN")).toEqual({ ok: true, to: "CANCELLED" });
      expect(transition(status, "FORCE_CANCEL", "STARTUP").ok).toBe(false);
      expect(transition(status, "FORCE_CANCEL", "CREATOR").ok).toBe(false);
    }
    for (const status of ["COMPLETED", "CANCELLED"] as const) expect(transition(status, "FORCE_CANCEL", "SYSTEM").ok).toBe(false);
  });

  it("lets the system settle a chargeback, but only an admin release the money", () => {
    expect(transition("DISPUTED", "RESOLVE_REFUND", "SYSTEM")).toEqual({ ok: true, to: "CANCELLED" });
    expect(transition("DISPUTED", "RESOLVE_RESUME", "SYSTEM", { resumeTo: "VERIFYING" })).toEqual({ ok: true, to: "VERIFYING" });
    expect(transition("DISPUTED", "RESOLVE_RELEASE", "SYSTEM").ok).toBe(false);
  });

  it("lists every action only for the actors the table names", () => {
    expect(allowedActions("DRAFT_SUBMITTED", "STARTUP").sort()).toEqual(["APPROVE_DRAFT", "OPEN_DISPUTE", "REQUEST_CHANGES"]);
    expect(allowedActions("DRAFT_SUBMITTED", "CREATOR")).toEqual(["OPEN_DISPUTE"]);
  });
});

describe("FUNDED_STATUSES", () => {
  it("covers every status between the escrow and the payout, and nothing before or after", () => {
    expect(FUNDED_STATUSES).not.toContain("CONTRACT_PENDING");
    expect(FUNDED_STATUSES).not.toContain("AWAITING_ESCROW");
    expect(FUNDED_STATUSES).not.toContain("COMPLETED");
    expect(FUNDED_STATUSES).not.toContain("CANCELLED");
    expect(FUNDED_STATUSES).toContain("DISPUTED");
  });
});

describe("stageOf", () => {
  it("maps every status to a stage of the lifecycle", () => {
    const statuses: DealStatus[] = [
      "CONTRACT_PENDING", "AWAITING_ESCROW", "IN_PRODUCTION", "DRAFT_SUBMITTED", "CHANGES_REQUESTED", "DRAFT_APPROVED",
      "POST_SCHEDULED", "POST_SUBMITTED", "VERIFYING", "REPOST_REQUIRED", "PAYOUT_PENDING", "COMPLETED", "DISPUTED", "CANCELLED",
    ];
    for (const status of statuses) expect(LIFECYCLE_STAGES).toContain(stageOf(status));
  });

  it("keeps a disputed deal on the stage it was frozen at", () => {
    expect(stageOf("DISPUTED", "POST_SUBMITTED")).toBe("LIVE");
    expect(stageOf("DISPUTED", null)).toBe("VERIFICATION");
  });
});

describe("waitingFor", () => {
  it("names the party that has not signed yet", () => {
    expect(waitingFor("CONTRACT_PENDING", { brandSigned: true, creatorSigned: false })).toEqual(["CREATOR"]);
    expect(waitingFor("CONTRACT_PENDING", { brandSigned: false, creatorSigned: false })).toEqual(["STARTUP", "CREATOR"]);
  });

  it("points at the brand for review and payment and at the creator for production", () => {
    expect(waitingFor("DRAFT_SUBMITTED")).toEqual(["STARTUP"]);
    expect(waitingFor("AWAITING_ESCROW")).toEqual(["STARTUP"]);
    expect(waitingFor("IN_PRODUCTION")).toEqual(["CREATOR"]);
    expect(waitingFor("COMPLETED")).toEqual([]);
  });
});
