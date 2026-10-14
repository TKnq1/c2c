import { prisma } from "@/lib/prisma";
import { issueAndAnnounce } from "@/lib/billing/announce";
import { alertAdmins, dayKey } from "@/lib/deals/alerts";
import { planDealActions, type DealSnapshot, type PlannedAction } from "@/lib/deals/deadlines";
import { DEAL_POLICY, type ReminderKey } from "@/lib/deals/policy";
import { onEscrowFunded } from "@/lib/deals/escrow";
import { purgeOldProofs } from "@/lib/deals/retention";
import { dealHref, notifyDealParty } from "@/lib/deals/notify";
import type { NoticeKey } from "@/lib/deals/notices";
import { claimReminder, loadDeal, moveDeal, type DealView } from "@/lib/deals/service";
import { cancelDeal, finishVerificationWindow, openDealDispute, releaseDealPayout } from "@/lib/deals/payout";
import { verifyDealPosts } from "@/lib/deals/verification";
import { parseTerms } from "@/lib/deals/terms";

// The daily job: reads the deals that can have a deadline, asks the planner (deadlines.ts) what is due, and carries each
// action out through the same functions the people's own buttons use. One failing deal never stops the others.

// Statuses the planner has something to say about, plus finished deals whose usage rights can still lapse.
const ACTIVE_STATUSES = [
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
] as const;

export async function loadSnapshots(): Promise<DealSnapshot[]> {
  const deals = await prisma.deal.findMany({
    where: {
      OR: [
        { status: { in: [...ACTIVE_STATUSES] } },
        { status: "COMPLETED", usageExpiresAt: { not: null }, NOT: { remindersSent: { has: "usage_expired" } } },
      ],
    },
    select: {
      id: true,
      status: true,
      statusChangedAt: true,
      draftDueAt: true,
      draftReviewDueAt: true,
      revisionDueAt: true,
      postWindowEnd: true,
      scheduledFor: true,
      graceUntil: true,
      verificationEndsAt: true,
      usageExpiresAt: true,
      remindersSent: true,
      terms: true,
      drafts: { where: { status: "APPROVED" }, orderBy: { reviewedAt: "desc" }, take: 1, select: { reviewedAt: true } },
    },
  });
  return deals.map((d) => ({
    id: d.id,
    status: d.status,
    statusChangedAt: d.statusChangedAt,
    draftDueAt: d.draftDueAt,
    draftReviewDueAt: d.draftReviewDueAt,
    revisionDueAt: d.revisionDueAt,
    postWindowEnd: d.postWindowEnd,
    draftApprovedAt: d.drafts[0]?.reviewedAt ?? null,
    scheduledFor: d.scheduledFor,
    graceUntil: d.graceUntil,
    verificationEndsAt: d.verificationEndsAt,
    usageExpiresAt: d.usageExpiresAt,
    remindersSent: d.remindersSent,
    draftRequired: parseTerms(d.terms).workflow.draftRequired,
  }));
}

type ReminderPlan = { to: "creator" | "brand"; notice: NoticeKey; date: (view: DealView) => Date | null; hours?: number };

const REMINDERS: Partial<Record<ReminderKey, ReminderPlan>> = {
  draft_due: { to: "creator", notice: "reminder_draft_due", date: (v) => v.deal.draftDueAt, hours: DEAL_POLICY.draftGraceHours },
  review_due: { to: "brand", notice: "reminder_review_due", date: (v) => v.deal.draftReviewDueAt },
  revision_due: { to: "creator", notice: "reminder_revision_due", date: (v) => v.deal.revisionDueAt, hours: DEAL_POLICY.revisionGraceHours },
  post_due: { to: "creator", notice: "reminder_post_due", date: (v) => v.deal.postWindowEnd, hours: DEAL_POLICY.postGraceHours },
  scheduled_missed: { to: "creator", notice: "reminder_scheduled_missed", date: (v) => v.deal.scheduledFor },
};

async function remind(dealId: string, reminder: ReminderKey) {
  const plan = REMINDERS[reminder];
  const view = await loadDeal(dealId);
  if (!plan || !view) return;
  if (!(await claimReminder(dealId, reminder))) return;
  const userId = plan.to === "creator" ? view.creatorUserId : view.brandUserId;
  await notifyDealParty(
    userId,
    plan.notice,
    { title: view.title, date: plan.date(view) ?? new Date(), hours: plan.hours ?? 0, brand: view.brandName },
    dealHref(dealId),
  );
}

async function autoApproveDraft(dealId: string) {
  const view = await loadDeal(dealId);
  if (!view) return;
  const moved = await moveDeal(dealId, "APPROVE_DRAFT", "SYSTEM", { expectedFrom: "DRAFT_SUBMITTED", event: "draft.auto_approved" });
  if (!moved.ok) return;
  const latest = await prisma.dealDraft.findFirst({ where: { dealId, status: "SUBMITTED" }, orderBy: { version: "desc" } });
  if (latest) {
    await prisma.dealDraft.update({ where: { id: latest.id }, data: { status: "APPROVED", autoApproved: true, reviewedAt: new Date() } });
  }
  await notifyDealParty(view.creatorUserId, "draft_auto_approved_creator", { title: view.title, brand: view.brandName }, dealHref(dealId));
  await notifyDealParty(view.brandUserId, "draft_auto_approved_brand", { title: view.title }, dealHref(dealId));
}

async function usageNotice(dealId: string, reminder: "usage_expiring" | "usage_expired") {
  const view = await loadDeal(dealId);
  if (!view || !view.deal.usageExpiresAt) return;
  if (!(await claimReminder(dealId, reminder))) return;
  const params = { title: view.title, date: view.deal.usageExpiresAt, creator: view.creatorName };
  await notifyDealParty(view.brandUserId, reminder, params, dealHref(dealId));
  if (reminder === "usage_expired") await notifyDealParty(view.creatorUserId, reminder, params, dealHref(dealId));
}

export async function executePlannedAction(action: PlannedAction, now: Date): Promise<string> {
  switch (action.kind) {
    case "REMIND":
      await remind(action.dealId, action.reminder);
      return `remind:${action.reminder}`;
    case "CANCEL": {
      const result = await cancelDeal(action.dealId, action.reason, "SYSTEM");
      return result.ok ? `cancel:${action.reason}` : `cancel-failed:${result.error}`;
    }
    case "AUTO_APPROVE_DRAFT":
      await autoApproveDraft(action.dealId);
      return "draft.auto_approved";
    case "OPEN_DISPUTE": {
      const result = await openDealDispute(action.dealId, { reason: action.reason, details: null, actor: "SYSTEM" });
      return result.ok ? `dispute:${action.reason}` : `dispute-failed:${result.error}`;
    }
    case "VERIFY_POSTS":
      await verifyDealPosts(action.dealId, now);
      return "verify";
    case "FINISH_WINDOW":
      await finishVerificationWindow(action.dealId, now);
      return "finish-window";
    case "RETRY_PAYOUT": {
      const result = await releaseDealPayout(action.dealId);
      return result.error ? `payout-failed` : "payout";
    }
    case "USAGE_NOTICE":
      await usageNotice(action.dealId, action.reminder);
      return action.reminder;
  }
}

export type RunSummary = {
  planned: number;
  results: Record<string, number>;
  failures: { dealId: string; error: string }[];
  invoicesIssued: number;
  healed: number;
  proofsPurged: number;
};

// A deal that waits for the payment while the money is already held: the webhook was cut off between the payment and the
// deal (it moves both, but not in one transaction). Stripe retries the webhook, but not forever, so the daily job closes the gap.
async function healFundedDeals(now: Date): Promise<number> {
  const stuck = await prisma.deal.findMany({
    where: { status: "AWAITING_ESCROW", interest: { paymentStatus: "HELD" } },
    select: { id: true },
    take: 50,
  });
  let healed = 0;
  for (const { id } of stuck) {
    try {
      await onEscrowFunded(id, now);
      healed += 1;
    } catch (err) {
      console.error("Healing a funded deal failed", { dealId: id, err });
      alertAdmins({
        key: `deal-heal-failed-${id}-${dayKey(now)}`,
        title: "Bezahlter Deal hängt in „Warten auf Zahlung“",
        lines: [`Der Deal ${id} ist bezahlt (das Geld liegt im Treuhandkonto), steht aber noch auf „Warten auf Zahlung“: ${err instanceof Error ? err.message : String(err)}`, "Der tägliche Lauf versucht es morgen erneut."],
      });
    }
  }
  return healed;
}

// Completed deals whose invoices could not be written (the tax details were missing) are caught up here.
async function issueMissingInvoices(): Promise<number> {
  const missing = await prisma.deal.findMany({
    where: {
      status: "COMPLETED",
      OR: [{ invoices: { none: { kind: "BRAND_INVOICE" } } }, { invoices: { none: { kind: "CREATOR_CREDIT_NOTE" } } }],
    },
    select: { id: true },
    take: 20,
  });
  let issued = 0;
  for (const { id } of missing) {
    try {
      issued += (await issueAndAnnounce(id)).issued.length;
    } catch (err) {
      console.error("Issuing a missing invoice failed", { dealId: id, err });
      alertAdmins({
        key: `deal-invoice-failed-${id}-${dayKey()}`,
        title: "Rechnung konnte nicht erstellt werden",
        lines: [`Beim Nachholen der Rechnungen für den Deal ${id} ist ein Fehler aufgetreten: ${err instanceof Error ? err.message : String(err)}`, "Der tägliche Lauf versucht es morgen erneut."],
      });
    }
  }
  return issued;
}

export async function runDealDeadlines(now = new Date()): Promise<RunSummary> {
  const snapshots = await loadSnapshots();
  const actions = planDealActions(snapshots, now);
  const summary: RunSummary = { planned: actions.length, results: {}, failures: [], invoicesIssued: 0, healed: 0, proofsPurged: 0 };

  for (const action of actions) {
    try {
      const outcome = await executePlannedAction(action, now);
      summary.results[outcome] = (summary.results[outcome] ?? 0) + 1;
    } catch (err) {
      console.error("Deal action failed", { action, err });
      summary.failures.push({ dealId: action.dealId, error: err instanceof Error ? err.message : String(err) });
      alertAdmins({
        key: `deal-action-failed-${action.dealId}-${action.kind}-${dayKey(now)}`,
        title: "Fehler im täglichen Deal-Lauf",
        lines: [`Aktion ${action.kind} für den Deal ${action.dealId} ist fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`, "Der Lauf versucht es morgen erneut."],
      });
    }
  }
  summary.healed = await healFundedDeals(now);
  summary.invoicesIssued = await issueMissingInvoices();
  // A failing clean-up must not hide what the rest of the job did.
  summary.proofsPurged = await purgeOldProofs(now).catch((err) => {
    console.error("Deleting old proofs failed", err);
    return 0;
  });
  return summary;
}
