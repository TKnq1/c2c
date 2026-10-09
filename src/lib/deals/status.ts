import type { DealStatus } from "@prisma/client";

// The deal's state machine. One table says which status can follow which, by whom; every change of status in the
// application goes through `transition()`, so a rule is written down once and the tests can walk the whole table.

export type Actor = "STARTUP" | "CREATOR" | "SYSTEM" | "ADMIN";

export type DealAction =
  | "SIGN_CONTRACT"
  | "FUND_ESCROW"
  | "SUBMIT_DRAFT"
  | "APPROVE_DRAFT"
  | "REQUEST_CHANGES"
  | "SCHEDULE_POST"
  | "SUBMIT_POST"
  | "POST_VERIFIED"
  | "POST_REMOVED"
  | "WINDOW_ELAPSED"
  | "PAYOUT_RELEASED"
  | "OPEN_DISPUTE"
  | "RESOLVE_RELEASE"
  | "RESOLVE_REFUND"
  | "RESOLVE_RESUME"
  | "CANCEL"
  // The money was taken back outside the app (a refund made in Stripe, a lost chargeback): the deal ends wherever it stood.
  | "FORCE_CANCEL";

type Rule = { to: DealStatus | "SIGNING" | "RESUME"; actors: Actor[] };

const PARTIES: Actor[] = ["STARTUP", "CREATOR"];
const ANYONE: Actor[] = ["STARTUP", "CREATOR", "SYSTEM", "ADMIN"];

// "SIGNING": stays in CONTRACT_PENDING until the second signature, then AWAITING_ESCROW.
// "RESUME": back to where the deal was before the dispute (chosen by the admin).
const TRANSITIONS: Record<DealStatus, Partial<Record<DealAction, Rule>>> = {
  CONTRACT_PENDING: {
    SIGN_CONTRACT: { to: "SIGNING", actors: PARTIES },
    CANCEL: { to: "CANCELLED", actors: ANYONE },
  },
  AWAITING_ESCROW: {
    FUND_ESCROW: { to: "IN_PRODUCTION", actors: ["SYSTEM"] },
    CANCEL: { to: "CANCELLED", actors: ANYONE },
  },
  IN_PRODUCTION: {
    SUBMIT_DRAFT: { to: "DRAFT_SUBMITTED", actors: ["CREATOR"] },
    SCHEDULE_POST: { to: "POST_SCHEDULED", actors: ["CREATOR"] },
    SUBMIT_POST: { to: "POST_SUBMITTED", actors: ["CREATOR"] },
    OPEN_DISPUTE: { to: "DISPUTED", actors: [...PARTIES, "SYSTEM"] },
    CANCEL: { to: "CANCELLED", actors: ANYONE },
  },
  DRAFT_SUBMITTED: {
    APPROVE_DRAFT: { to: "DRAFT_APPROVED", actors: ["STARTUP", "SYSTEM"] },
    REQUEST_CHANGES: { to: "CHANGES_REQUESTED", actors: ["STARTUP"] },
    OPEN_DISPUTE: { to: "DISPUTED", actors: [...PARTIES, "SYSTEM"] },
  },
  CHANGES_REQUESTED: {
    SUBMIT_DRAFT: { to: "DRAFT_SUBMITTED", actors: ["CREATOR"] },
    OPEN_DISPUTE: { to: "DISPUTED", actors: [...PARTIES, "SYSTEM"] },
    CANCEL: { to: "CANCELLED", actors: ["CREATOR", "SYSTEM", "ADMIN"] },
  },
  DRAFT_APPROVED: {
    SCHEDULE_POST: { to: "POST_SCHEDULED", actors: ["CREATOR"] },
    SUBMIT_POST: { to: "POST_SUBMITTED", actors: ["CREATOR"] },
    OPEN_DISPUTE: { to: "DISPUTED", actors: [...PARTIES, "SYSTEM"] },
    CANCEL: { to: "CANCELLED", actors: ["CREATOR", "SYSTEM", "ADMIN"] },
  },
  POST_SCHEDULED: {
    SCHEDULE_POST: { to: "POST_SCHEDULED", actors: ["CREATOR"] },
    SUBMIT_POST: { to: "POST_SUBMITTED", actors: ["CREATOR"] },
    OPEN_DISPUTE: { to: "DISPUTED", actors: [...PARTIES, "SYSTEM"] },
    CANCEL: { to: "CANCELLED", actors: ["CREATOR", "SYSTEM", "ADMIN"] },
  },
  POST_SUBMITTED: {
    SUBMIT_POST: { to: "POST_SUBMITTED", actors: ["CREATOR"] },
    // The system verifies links; the brand confirms what cannot be checked by link (Stories).
    POST_VERIFIED: { to: "VERIFYING", actors: ["SYSTEM", "STARTUP"] },
    POST_REMOVED: { to: "REPOST_REQUIRED", actors: ["SYSTEM"] },
    OPEN_DISPUTE: { to: "DISPUTED", actors: [...PARTIES, "SYSTEM"] },
  },
  VERIFYING: {
    WINDOW_ELAPSED: { to: "PAYOUT_PENDING", actors: ["SYSTEM"] },
    POST_REMOVED: { to: "REPOST_REQUIRED", actors: ["SYSTEM"] },
    OPEN_DISPUTE: { to: "DISPUTED", actors: [...PARTIES, "SYSTEM"] },
  },
  REPOST_REQUIRED: {
    SUBMIT_POST: { to: "POST_SUBMITTED", actors: ["CREATOR"] },
    OPEN_DISPUTE: { to: "DISPUTED", actors: [...PARTIES, "SYSTEM"] },
  },
  PAYOUT_PENDING: {
    PAYOUT_RELEASED: { to: "COMPLETED", actors: ["SYSTEM", "ADMIN"] },
    // The brand can still object until the money is out; the creator has nothing to dispute here.
    OPEN_DISPUTE: { to: "DISPUTED", actors: ["STARTUP", "SYSTEM"] },
  },
  COMPLETED: {},
  DISPUTED: {
    RESOLVE_RELEASE: { to: "PAYOUT_PENDING", actors: ["ADMIN"] },
    // The system settles a chargeback when the card network has decided (a lost one is a refund, a won one carries on).
    RESOLVE_REFUND: { to: "CANCELLED", actors: ["ADMIN", "SYSTEM"] },
    RESOLVE_RESUME: { to: "RESUME", actors: ["ADMIN", "SYSTEM"] },
  },
  CANCELLED: {},
};

export type TransitionResult =
  | { ok: true; to: DealStatus }
  | { ok: false; reason: "ACTION_NOT_ALLOWED" | "ACTOR_NOT_ALLOWED" | "RESUME_TARGET_REQUIRED" };

export type TransitionContext = {
  // For SIGN_CONTRACT: the other party has already signed.
  otherPartySigned?: boolean;
  // For RESOLVE_RESUME: where the deal goes back to.
  resumeTo?: DealStatus | null;
};

export const TERMINAL_STATUSES: readonly DealStatus[] = ["COMPLETED", "CANCELLED"];

// A deal that is not finished can always be ended by the system or an admin when its money is gone.
for (const status of Object.keys(TRANSITIONS) as DealStatus[]) {
  if (!TERMINAL_STATUSES.includes(status)) TRANSITIONS[status].FORCE_CANCEL = { to: "CANCELLED", actors: ["SYSTEM", "ADMIN"] };
}

export function isTerminal(status: DealStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

// Statuses in which the escrow is funded and the money is still held.
export const FUNDED_STATUSES: readonly DealStatus[] = [
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

export function transition(from: DealStatus, action: DealAction, actor: Actor, ctx: TransitionContext = {}): TransitionResult {
  const rule = TRANSITIONS[from][action];
  if (!rule) return { ok: false, reason: "ACTION_NOT_ALLOWED" };
  if (!rule.actors.includes(actor)) return { ok: false, reason: "ACTOR_NOT_ALLOWED" };
  if (rule.to === "SIGNING") return { ok: true, to: ctx.otherPartySigned ? "AWAITING_ESCROW" : "CONTRACT_PENDING" };
  if (rule.to === "RESUME") {
    const target = ctx.resumeTo;
    if (!target || target === "DISPUTED" || isTerminal(target) || !FUNDED_STATUSES.includes(target)) {
      return { ok: false, reason: "RESUME_TARGET_REQUIRED" };
    }
    return { ok: true, to: target };
  }
  return { ok: true, to: rule.to };
}

export function allowedActions(from: DealStatus, actor: Actor): DealAction[] {
  return (Object.keys(TRANSITIONS[from]) as DealAction[]).filter((a) => TRANSITIONS[from][a]?.actors.includes(actor));
}

// The campaign as one line, from the brief to the payout, for the stepper on the deal page. The first two stages happen
// before a deal exists (briefing on the request, application as the Interest).
export const LIFECYCLE_STAGES = [
  "BRIEFING",
  "APPLICATION",
  "AGREEMENT",
  "DRAFT",
  "APPROVAL",
  "SCHEDULING",
  "LIVE",
  "VERIFICATION",
  "PAYOUT",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export function stageOf(status: DealStatus, before?: DealStatus | null): LifecycleStage {
  switch (status) {
    case "CONTRACT_PENDING":
    case "AWAITING_ESCROW":
      return "AGREEMENT";
    case "IN_PRODUCTION":
    case "CHANGES_REQUESTED":
      return "DRAFT";
    case "DRAFT_SUBMITTED":
      return "APPROVAL";
    case "DRAFT_APPROVED":
    case "POST_SCHEDULED":
      return "SCHEDULING";
    case "POST_SUBMITTED":
      return "LIVE";
    case "VERIFYING":
    case "REPOST_REQUIRED":
      return "VERIFICATION";
    case "PAYOUT_PENDING":
    case "COMPLETED":
      return "PAYOUT";
    case "DISPUTED":
      return before && before !== "DISPUTED" ? stageOf(before) : "VERIFICATION";
    case "CANCELLED":
      return "AGREEMENT";
  }
}

export type WaitingFor = Actor | null;

// Who has to do something next, for the "your turn / waiting for" line.
export function waitingFor(
  status: DealStatus,
  ctx: { brandSigned?: boolean; creatorSigned?: boolean } = {},
): WaitingFor[] {
  switch (status) {
    case "CONTRACT_PENDING": {
      const waiting: WaitingFor[] = [];
      if (!ctx.brandSigned) waiting.push("STARTUP");
      if (!ctx.creatorSigned) waiting.push("CREATOR");
      return waiting;
    }
    case "AWAITING_ESCROW":
      return ["STARTUP"];
    case "IN_PRODUCTION":
    case "CHANGES_REQUESTED":
    case "DRAFT_APPROVED":
    case "POST_SCHEDULED":
    case "REPOST_REQUIRED":
      return ["CREATOR"];
    case "DRAFT_SUBMITTED":
      return ["STARTUP"];
    case "POST_SUBMITTED":
    case "VERIFYING":
    case "PAYOUT_PENDING":
      return ["SYSTEM"];
    case "DISPUTED":
      return ["ADMIN"];
    case "COMPLETED":
    case "CANCELLED":
      return [];
  }
}
