import type { DealStatus } from "@prisma/client";
import type { DealSection } from "@/lib/deals/sections";
import type { UiKey } from "@/lib/deals/ui-copy";

// How the deal page is laid out for the state a deal is in. The page is long (payment, drafts, posts, usage rights, invoices,
// dispute), and on a phone only one of those is the task right now: that one stands directly under the "next step" card, the
// ones that are behind the deal shrink to a one-line summary, and the rest follows in the usual order.

export type PanelId = "escrow" | "drafts" | "posts" | "usage" | "invoices" | "dispute";

const DEFAULT_ORDER: PanelId[] = ["escrow", "drafts", "posts", "usage", "invoices", "dispute"];

// The part of the page the person's next step is done in, and what the button on the "next step" card says. Only steps that
// have a form (or a button) in a part further down; signing the contract happens in the contract itself, right under the card.
export const STEP_ACTIONS: Partial<Record<UiKey, { section: DealSection; label: UiKey }>> = {
  "next.escrow.pay": { section: "escrow", label: "next.action.escrow" },
  "next.production.draft": { section: "drafts", label: "next.action.draft" },
  "next.production.post": { section: "posts", label: "next.action.post" },
  "next.draft.review": { section: "drafts", label: "next.action.review" },
  "next.changes.creator": { section: "drafts", label: "next.action.revise" },
  "next.approved.creator": { section: "posts", label: "next.action.post" },
  "next.scheduled.creator": { section: "posts", label: "next.action.post" },
  "next.submittedProof.brand": { section: "posts", label: "next.action.proof" },
  "next.repost.creator": { section: "posts", label: "next.action.repost" },
};

export function stepAction(key: UiKey): { section: DealSection; label: UiKey } | null {
  return STEP_ACTIONS[key] ?? null;
}

// The part the deal is in right now. The contract is not one of them: it is the task until both sides have confirmed, and
// reference material afterwards.
export function currentPanel(status: DealStatus, draftRequired: boolean): PanelId | null {
  switch (status) {
    case "CONTRACT_PENDING":
      return null;
    case "AWAITING_ESCROW":
    case "CANCELLED":
      return "escrow";
    case "IN_PRODUCTION":
      return draftRequired ? "drafts" : "posts";
    case "DRAFT_SUBMITTED":
    case "CHANGES_REQUESTED":
      return "drafts";
    case "DRAFT_APPROVED":
    case "POST_SCHEDULED":
    case "POST_SUBMITTED":
    case "VERIFYING":
    case "REPOST_REQUIRED":
    case "PAYOUT_PENDING":
      return "posts";
    case "COMPLETED":
      return "invoices";
    case "DISPUTED":
      return "dispute";
  }
}

const PAST_DRAFTS: DealStatus[] = ["DRAFT_APPROVED", "POST_SCHEDULED", "POST_SUBMITTED", "REPOST_REQUIRED", "VERIFYING", "PAYOUT_PENDING", "COMPLETED"];

// Whether a part is behind the deal. In a dispute or after a cancellation nothing is folded away: everything stays where it
// was, because that is what the person will want to look through.
function isBehind(id: PanelId, status: DealStatus): boolean {
  if (status === "DISPUTED" || status === "CANCELLED") return false;
  switch (id) {
    case "escrow":
      return status !== "CONTRACT_PENDING" && status !== "AWAITING_ESCROW";
    case "drafts":
      return PAST_DRAFTS.includes(status);
    case "posts":
      return status === "COMPLETED";
    default:
      return false;
  }
}

export type PanelSlot = { id: PanelId; behind: boolean };

// The current part first, then the others that still matter in the usual order, then the ones behind the deal as summaries.
export function planPanels(status: DealStatus, draftRequired: boolean): PanelSlot[] {
  const current = currentPanel(status, draftRequired);
  const slots = DEFAULT_ORDER.map((id) => ({ id, behind: id !== current && isBehind(id, status) }));
  return [...slots.filter((s) => s.id === current), ...slots.filter((s) => s.id !== current && !s.behind), ...slots.filter((s) => s.behind)];
}
