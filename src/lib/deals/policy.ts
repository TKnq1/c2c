// The numbers behind the automatic handling of a deal. They are also what the contract tells both sides, so changing
// one is a change of terms: bump DEAL_TERMS_VERSION in terms.ts and tell the users.

export const DEAL_POLICY = {
  // An unsigned contract / an unfunded escrow lapses after this many days.
  contractExpiryDays: 7,
  escrowExpiryDays: 7,
  // No posting window in the briefing: the post is due this long after the escrow was funded.
  defaultPostingDays: 30,
  // The first draft is never due earlier than this after funding.
  minDraftLeadHours: 48,
  // A creator who misses the draft deadline gets this long before the deal is cancelled and refunded.
  draftGraceHours: 72,
  // Time to resubmit after the brand asked for changes, and the grace on top of it.
  revisionDays: 3,
  revisionGraceHours: 48,
  // After the end of the posting window with no post submitted.
  postGraceHours: 48,
  // A scheduled date that passes without a link is reminded after this long.
  scheduledReminderHours: 24,
  // If the brand takes long over a draft, the creator still gets this long to post after the approval.
  minPostHoursAfterApproval: 48,
  // A removed post can be published again within this time before the deal is frozen as a dispute.
  repostGraceHours: 48,
  // Checks in a row that must fail before a post counts as removed (one failure can be an outage).
  removalConfirmFailures: 2,
  // A reminder goes out this long before a brand's review time runs out.
  reviewReminderHours: 24,
} as const;

export type ReminderKey =
  | "draft_due"
  | "review_due"
  | "revision_due"
  | "post_due"
  | "scheduled_missed"
  | "usage_expiring"
  | "usage_expired";

export type CancelReason =
  | "CONTRACT_EXPIRED"
  | "ESCROW_EXPIRED"
  | "DRAFT_DEADLINE_MISSED"
  | "REVISION_DEADLINE_MISSED"
  | "POST_DEADLINE_MISSED"
  | "CANCELLED_BY_BRAND"
  | "CANCELLED_BY_CREATOR"
  | "DISPUTE_REFUND";

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
