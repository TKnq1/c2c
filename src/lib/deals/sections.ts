import type { NoticeKey } from "@/lib/deals/notices";

// Where on the deal page a link lands. The deal page is long (contract, escrow, drafts, posts, usage rights, invoices, dispute,
// timeline), so a notice about a draft opens at the drafts instead of at the top. The anchors are the ids of the sections in
// src/components/deals/panels.tsx; a test keeps the two in step.

export const DEAL_SECTIONS = ["contract", "escrow", "drafts", "posts", "usage", "dispute", "invoices", "timeline"] as const;
export type DealSection = (typeof DEAL_SECTIONS)[number];

export function dealHref(dealId: string, section?: DealSection): string {
  return `/dashboard/deals/${dealId}${section ? `#${section}` : ""}`;
}

// The section a notice is about. A notice that is not listed opens the deal at the top.
export const NOTICE_SECTION: Partial<Record<NoticeKey, DealSection>> = {
  deal_created: "contract",
  contract_sign: "contract",
  escrow_due: "escrow",
  escrow_funded_draft: "drafts",
  escrow_funded_direct: "posts",
  draft_submitted: "drafts",
  draft_approved: "posts",
  draft_auto_approved_creator: "posts",
  draft_auto_approved_brand: "drafts",
  draft_changes: "drafts",
  draft_rejected: "dispute",
  post_scheduled: "posts",
  post_submitted: "posts",
  post_confirm_needed: "posts",
  post_verified_creator: "posts",
  post_verified_brand: "posts",
  post_removed_creator: "posts",
  post_removed_brand: "posts",
  disclosure_warning: "posts",
  usage_delivered: "usage",
  usage_delivery_needed: "usage",
  usage_expiring: "usage",
  usage_expired: "usage",
  dispute_opened: "dispute",
  dispute_released: "dispute",
  dispute_refunded: "dispute",
  dispute_resumed: "dispute",
  chargeback_lost: "timeline",
  refunded_outside: "timeline",
  reminder_draft_due: "drafts",
  reminder_review_due: "drafts",
  reminder_revision_due: "drafts",
  reminder_post_due: "posts",
  reminder_scheduled_missed: "posts",
};

// A link to a deal with the section of the notice added. Links that are not to a deal page (an invoice, the payments page) and
// links that already name a section stay as they are.
export function linkWithSection(link: string, key: NoticeKey): string {
  const section = NOTICE_SECTION[key];
  if (!section || link.includes("#") || !/^\/dashboard\/deals\/[^/?#]+$/.test(link)) return link;
  return `${link}#${section}`;
}
