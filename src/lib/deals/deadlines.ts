import type { DealStatus, DisputeReason } from "@prisma/client";
import { DAY_MS, DEAL_POLICY, HOUR_MS, type CancelReason, type ReminderKey } from "@/lib/deals/policy";
import type { DealTerms } from "@/lib/deals/terms";
import { USAGE_EXPIRY_WARNING_DAYS } from "@/lib/compliance/usage-rights";

// Dates a deal runs on, and the daily job's plan: given the deals as they stand, which of them need a reminder, an
// automatic decision or a check. The plan is a pure function so the whole policy can be tested without a database; the
// executor (handlers.ts) carries each action out under the same status checks the people's own actions use.

function endOfUtcDay(isoDay: string): Date {
  return new Date(`${isoDay}T23:59:59.999Z`);
}

function startOfUtcDay(isoDay: string): Date {
  return new Date(`${isoDay}T00:00:00.000Z`);
}

export type InitialDeadlines = {
  postWindowStart: Date;
  postWindowEnd: Date;
  draftDueAt: Date | null;
};

// Set when the escrow is funded: from then on the creator is on the clock.
export function computeDeadlines(terms: DealTerms, fundedAt: Date): InitialDeadlines {
  const w = terms.workflow;
  const postWindowEnd = w.postingWindowEnd ? endOfUtcDay(w.postingWindowEnd) : new Date(fundedAt.getTime() + DEAL_POLICY.defaultPostingDays * DAY_MS);
  const requestedStart = w.postingWindowStart ? startOfUtcDay(w.postingWindowStart) : fundedAt;
  const postWindowStart = requestedStart.getTime() > postWindowEnd.getTime() ? postWindowEnd : requestedStart;

  let draftDueAt: Date | null = null;
  if (w.draftRequired) {
    const wanted = postWindowEnd.getTime() - w.draftDueDaysBeforePost * DAY_MS;
    const earliest = fundedAt.getTime() + DEAL_POLICY.minDraftLeadHours * HOUR_MS;
    draftDueAt = new Date(Math.min(Math.max(wanted, earliest), postWindowEnd.getTime()));
  }
  return { postWindowStart, postWindowEnd, draftDueAt };
}

export function reviewDueAt(submittedAt: Date, brandReviewDays: number): Date {
  return new Date(submittedAt.getTime() + brandReviewDays * DAY_MS);
}

export function revisionDueAt(requestedAt: Date): Date {
  return new Date(requestedAt.getTime() + DEAL_POLICY.revisionDays * DAY_MS);
}

export function verificationEndsAt(firstLiveAt: Date, minLiveHours: number): Date {
  return new Date(firstLiveAt.getTime() + minLiveHours * HOUR_MS);
}

// The last moment the creator can still post: the window's end, or a short time after a late approval of the draft.
export function postDeadline(postWindowEnd: Date, draftApprovedAt: Date | null): Date {
  if (!draftApprovedAt) return postWindowEnd;
  const afterApproval = draftApprovedAt.getTime() + DEAL_POLICY.minPostHoursAfterApproval * HOUR_MS;
  return new Date(Math.max(postWindowEnd.getTime(), afterApproval));
}

export type DealSnapshot = {
  id: string;
  status: DealStatus;
  statusChangedAt: Date;
  draftDueAt: Date | null;
  draftReviewDueAt: Date | null;
  revisionDueAt: Date | null;
  postWindowEnd: Date | null;
  draftApprovedAt: Date | null;
  scheduledFor: Date | null;
  graceUntil: Date | null;
  verificationEndsAt: Date | null;
  usageExpiresAt: Date | null;
  remindersSent: string[];
  draftRequired: boolean;
};

export type PlannedAction =
  | { kind: "REMIND"; dealId: string; reminder: ReminderKey }
  | { kind: "CANCEL"; dealId: string; reason: CancelReason; refund: boolean }
  | { kind: "AUTO_APPROVE_DRAFT"; dealId: string }
  | { kind: "OPEN_DISPUTE"; dealId: string; reason: DisputeReason }
  | { kind: "VERIFY_POSTS"; dealId: string }
  | { kind: "FINISH_WINDOW"; dealId: string }
  | { kind: "RETRY_PAYOUT"; dealId: string }
  | { kind: "USAGE_NOTICE"; dealId: string; reminder: "usage_expiring" | "usage_expired" };

const past = (date: Date | null, now: Date, afterMs = 0): boolean => date !== null && now.getTime() >= date.getTime() + afterMs;

export function planDealActions(deals: DealSnapshot[], now: Date): PlannedAction[] {
  const actions: PlannedAction[] = [];

  for (const deal of deals) {
    const remind = (reminder: ReminderKey) => {
      if (!deal.remindersSent.includes(reminder)) actions.push({ kind: "REMIND", dealId: deal.id, reminder });
    };
    const postDue = deal.postWindowEnd ? postDeadline(deal.postWindowEnd, deal.draftApprovedAt) : null;

    switch (deal.status) {
      case "CONTRACT_PENDING":
        if (past(deal.statusChangedAt, now, DEAL_POLICY.contractExpiryDays * DAY_MS)) {
          actions.push({ kind: "CANCEL", dealId: deal.id, reason: "CONTRACT_EXPIRED", refund: false });
        }
        break;

      case "AWAITING_ESCROW":
        if (past(deal.statusChangedAt, now, DEAL_POLICY.escrowExpiryDays * DAY_MS)) {
          actions.push({ kind: "CANCEL", dealId: deal.id, reason: "ESCROW_EXPIRED", refund: false });
        }
        break;

      case "IN_PRODUCTION": {
        if (deal.draftRequired && deal.draftDueAt) {
          if (past(deal.draftDueAt, now, DEAL_POLICY.draftGraceHours * HOUR_MS)) {
            actions.push({ kind: "CANCEL", dealId: deal.id, reason: "DRAFT_DEADLINE_MISSED", refund: true });
            break;
          }
          if (past(deal.draftDueAt, now)) remind("draft_due");
        }
        if (past(postDue, now, DEAL_POLICY.postGraceHours * HOUR_MS)) {
          actions.push({ kind: "CANCEL", dealId: deal.id, reason: "POST_DEADLINE_MISSED", refund: true });
        } else if (past(postDue, now)) {
          remind("post_due");
        }
        break;
      }

      case "DRAFT_SUBMITTED":
        if (past(deal.draftReviewDueAt, now)) {
          // The brand did not answer in time: the draft counts as approved.
          actions.push({ kind: "AUTO_APPROVE_DRAFT", dealId: deal.id });
        } else if (deal.draftReviewDueAt && now.getTime() >= deal.draftReviewDueAt.getTime() - DEAL_POLICY.reviewReminderHours * HOUR_MS) {
          remind("review_due");
        }
        break;

      case "CHANGES_REQUESTED":
        if (past(deal.revisionDueAt, now, DEAL_POLICY.revisionGraceHours * HOUR_MS)) {
          actions.push({ kind: "CANCEL", dealId: deal.id, reason: "REVISION_DEADLINE_MISSED", refund: true });
        } else if (past(deal.revisionDueAt, now)) {
          remind("revision_due");
        }
        break;

      case "DRAFT_APPROVED":
      case "POST_SCHEDULED": {
        if (past(postDue, now, DEAL_POLICY.postGraceHours * HOUR_MS)) {
          actions.push({ kind: "CANCEL", dealId: deal.id, reason: "POST_DEADLINE_MISSED", refund: true });
          break;
        }
        // One reminder per run: the window being over says more than the planned date having passed.
        if (past(postDue, now)) {
          remind("post_due");
        } else if (deal.status === "POST_SCHEDULED" && past(deal.scheduledFor, now, DEAL_POLICY.scheduledReminderHours * HOUR_MS)) {
          remind("scheduled_missed");
        }
        break;
      }

      case "POST_SUBMITTED":
        actions.push({ kind: "VERIFY_POSTS", dealId: deal.id });
        break;

      case "VERIFYING":
        // The window's end is decided after one last look at the post, by the same executor.
        actions.push(past(deal.verificationEndsAt, now) ? { kind: "FINISH_WINDOW", dealId: deal.id } : { kind: "VERIFY_POSTS", dealId: deal.id });
        break;

      case "REPOST_REQUIRED":
        if (past(deal.graceUntil, now)) {
          actions.push({ kind: "OPEN_DISPUTE", dealId: deal.id, reason: "POST_REMOVED" });
        }
        break;

      case "PAYOUT_PENDING":
        actions.push({ kind: "RETRY_PAYOUT", dealId: deal.id });
        break;

      case "COMPLETED":
        if (deal.usageExpiresAt) {
          if (past(deal.usageExpiresAt, now)) {
            if (!deal.remindersSent.includes("usage_expired")) actions.push({ kind: "USAGE_NOTICE", dealId: deal.id, reminder: "usage_expired" });
          } else if (now.getTime() >= deal.usageExpiresAt.getTime() - USAGE_EXPIRY_WARNING_DAYS * DAY_MS) {
            if (!deal.remindersSent.includes("usage_expiring")) actions.push({ kind: "USAGE_NOTICE", dealId: deal.id, reminder: "usage_expiring" });
          }
        }
        break;

      case "DISPUTED":
      case "CANCELLED":
        break;
    }
  }
  return actions;
}
