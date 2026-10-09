import { describe, expect, it } from "vitest";
import type { DealStatus } from "@prisma/client";
import { DEAL_SECTIONS } from "@/lib/deals/sections";
import { STEP_ACTIONS, currentPanel, planPanels, stepAction } from "@/lib/deals/page-plan";
import { UI_WORDS } from "@/lib/deals/ui-copy";

const STATUSES: DealStatus[] = [
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
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
];

const ids = (status: DealStatus, draftRequired = true) => planPanels(status, draftRequired).map((s) => s.id);
const behind = (status: DealStatus, draftRequired = true) => planPanels(status, draftRequired).filter((s) => s.behind).map((s) => s.id);

describe("planPanels", () => {
  it("puts the part the deal is in first", () => {
    expect(ids("AWAITING_ESCROW")[0]).toBe("escrow");
    expect(ids("IN_PRODUCTION")[0]).toBe("drafts");
    expect(ids("DRAFT_SUBMITTED")[0]).toBe("drafts");
    expect(ids("CHANGES_REQUESTED")[0]).toBe("drafts");
    expect(ids("POST_SUBMITTED")[0]).toBe("posts");
    expect(ids("VERIFYING")[0]).toBe("posts");
    expect(ids("COMPLETED")[0]).toBe("invoices");
    expect(ids("DISPUTED")[0]).toBe("dispute");
  });

  it("goes straight to the post when the contract has no draft step", () => {
    expect(ids("IN_PRODUCTION", false)[0]).toBe("posts");
  });

  it("shows posts before drafts once the draft is approved", () => {
    const order = ids("DRAFT_APPROVED");
    expect(order.indexOf("posts")).toBeLessThan(order.indexOf("drafts"));
    expect(behind("DRAFT_APPROVED")).toEqual(["escrow", "drafts"]);
  });

  it("folds away what is behind the deal, and only that", () => {
    expect(behind("CONTRACT_PENDING")).toEqual([]);
    expect(behind("AWAITING_ESCROW")).toEqual([]);
    expect(behind("IN_PRODUCTION")).toEqual(["escrow"]);
    expect(behind("DRAFT_SUBMITTED")).toEqual(["escrow"]);
    expect(behind("POST_SUBMITTED")).toEqual(["escrow", "drafts"]);
    expect(behind("COMPLETED")).toEqual(["escrow", "drafts", "posts"]);
  });

  it("keeps everything open in a dispute or after a cancellation", () => {
    expect(behind("DISPUTED")).toEqual([]);
    expect(behind("CANCELLED")).toEqual([]);
  });

  it("lists every part exactly once, whatever the state", () => {
    for (const status of STATUSES) {
      for (const draftRequired of [true, false]) {
        expect([...ids(status, draftRequired)].sort(), status).toEqual(["dispute", "drafts", "escrow", "invoices", "posts", "usage"]);
      }
    }
  });

  it("puts the parts behind the deal after those that are still open", () => {
    const slots = planPanels("COMPLETED", true);
    const firstBehind = slots.findIndex((s) => s.behind);
    expect(slots.slice(firstBehind).every((s) => s.behind)).toBe(true);
  });
});

describe("currentPanel", () => {
  it("has no part while the contract is the task", () => {
    expect(currentPanel("CONTRACT_PENDING", true)).toBeNull();
  });
});

describe("the next-step button", () => {
  it("leads to a section of the page and has a text", () => {
    for (const [key, action] of Object.entries(STEP_ACTIONS)) {
      expect(key in UI_WORDS, key).toBe(true);
      expect(DEAL_SECTIONS, key).toContain(action!.section);
      expect(action!.label in UI_WORDS, key).toBe(true);
    }
  });

  it("leads to the part that is first on the page for the state the step belongs to", () => {
    const states: [Parameters<typeof stepAction>[0], DealStatus][] = [
      ["next.escrow.pay", "AWAITING_ESCROW"],
      ["next.production.draft", "IN_PRODUCTION"],
      ["next.draft.review", "DRAFT_SUBMITTED"],
      ["next.changes.creator", "CHANGES_REQUESTED"],
      ["next.approved.creator", "DRAFT_APPROVED"],
      ["next.scheduled.creator", "POST_SCHEDULED"],
      ["next.submittedProof.brand", "POST_SUBMITTED"],
      ["next.repost.creator", "REPOST_REQUIRED"],
    ];
    for (const [key, status] of states) expect(stepAction(key)?.section, key).toBe(ids(status)[0]);
    expect(stepAction("next.production.post")?.section).toBe(ids("IN_PRODUCTION", false)[0]);
  });

  it("is not offered for steps that are only waiting", () => {
    expect(stepAction("next.verifying")).toBeNull();
    expect(stepAction("next.contract.sign")).toBeNull();
  });
});
