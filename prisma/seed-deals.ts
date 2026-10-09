import "dotenv/config";
import type { DealStatus, Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { createDealInTx } from "../src/lib/deals/create";
import { completeContract } from "../src/lib/deals/contract";
import { onEscrowFunded } from "../src/lib/deals/escrow";
import { reviewDueAt, revisionDueAt, verificationEndsAt } from "../src/lib/deals/deadlines";
import { parseTerms } from "../src/lib/deals/terms";
import { issueDealInvoices } from "../src/lib/billing/issue";
import { DAY_MS, HOUR_MS } from "../src/lib/deals/policy";

// One demo deal for every status of the lifecycle, so a screen can be built or looked at in any state without clicking a
// deal through the whole flow. Run it after `npm run db:seed` (it needs the demo accounts):
//   npm run db:seed:deals
// Safe to run again: the demo deals of the last run are replaced. Local databases only.

const DEMO_PREFIX = "Deal demo: ";

const STATES: { status: DealStatus; label: string }[] = [
  { status: "CONTRACT_PENDING", label: "Contract to confirm" },
  { status: "AWAITING_ESCROW", label: "Waiting for payment" },
  { status: "IN_PRODUCTION", label: "Draft due" },
  { status: "DRAFT_SUBMITTED", label: "Draft in review" },
  { status: "CHANGES_REQUESTED", label: "Changes requested" },
  { status: "DRAFT_APPROVED", label: "Draft approved" },
  { status: "POST_SCHEDULED", label: "Post scheduled" },
  { status: "POST_SUBMITTED", label: "Post being checked" },
  { status: "VERIFYING", label: "Post live, hold period" },
  { status: "REPOST_REQUIRED", label: "Post removed" },
  { status: "PAYOUT_PENDING", label: "Payout due" },
  { status: "COMPLETED", label: "Completed" },
  { status: "DISPUTED", label: "Disputed" },
  { status: "CANCELLED", label: "Cancelled and refunded" },
];

const CAPTION = "Werbung | Meine neue Herbst-Routine mit GlowCo – Code GLOW10 #glowco #herbst";
const TIKTOK_URL = "https://www.tiktok.com/@miasummers/video/7300000000000000001";

function assertLocal() {
  const host = new URL(process.env.DATABASE_URL ?? "postgresql://invalid").hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host) || process.env.VERCEL_ENV || process.env.NODE_ENV === "production") {
    console.error(`Refusing to seed ${host}: local databases only.`);
    process.exit(1);
  }
}

async function businessProfiles(userIds: { id: string; name: string; role: "STARTUP" | "CREATOR" }[]) {
  const now = new Date();
  for (const user of userIds) {
    await prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        legalName: user.role === "STARTUP" ? `${user.name} GmbH` : user.name,
        businessType: user.role === "STARTUP" ? "COMPANY" : "FREELANCER",
        country: "DE",
        addressLine1: user.role === "STARTUP" ? "Torstraße 1" : "Linienstraße 5",
        postalCode: "10115",
        city: "Berlin",
        taxNumber: "12/345/67890",
        traderSelfCertifiedAt: now,
        traderCertVersion: "2026-10",
        ...(user.role === "CREATOR" ? { selfBillingAcceptedAt: now, selfBillingVersion: "2026-10" } : {}),
      },
    });
  }
}

async function removeEarlierDemos(startupId: string) {
  const requests = await prisma.request.findMany({ where: { startupId, title: { startsWith: DEMO_PREFIX } }, select: { id: true } });
  if (requests.length === 0) return;
  const deals = await prisma.deal.findMany({ where: { interest: { requestId: { in: requests.map((r) => r.id) } } }, select: { id: true } });
  // Invoices are not deleted with a deal (they outlive it by design), so they go first.
  await prisma.invoice.deleteMany({ where: { dealId: { in: deals.map((d) => d.id) } } });
  await prisma.request.deleteMany({ where: { id: { in: requests.map((r) => r.id) } } });
}

async function main() {
  assertLocal();
  process.env.BRAND_DEALS_ENABLED = "1";
  // The notices on the way would be mailed to the demo accounts: nothing is sent from here.
  process.env.EMAIL_DRY_RUN = "1";
  // The platform's own VAT ID, so the invoices of the completed demo deal can be written.
  process.env.IMPRINT_VAT_ID ||= "DE123456789";

  const brandUser = await prisma.user.findUnique({ where: { email: "startup1@example.com" }, include: { startupProfile: true } });
  const creatorUsers = await prisma.user.findMany({
    where: { email: { in: ["creator1@example.com", "creator2@example.com", "creator3@example.com", "creator4@example.com"] } },
    include: { creatorProfile: true },
    orderBy: { email: "asc" },
  });
  if (!brandUser?.startupProfile || creatorUsers.length === 0) {
    console.error("The demo accounts are missing. Run `npm run db:seed` first.");
    process.exit(1);
  }
  const startup = brandUser.startupProfile;

  await businessProfiles([
    { id: brandUser.id, name: startup.companyName, role: "STARTUP" },
    ...creatorUsers.map((u) => ({ id: u.id, name: u.creatorProfile!.displayName, role: "CREATOR" as const })),
  ]);
  await removeEarlierDemos(startup.id);

  const now = new Date();
  for (const [index, state] of STATES.entries()) {
    const creator = creatorUsers[index % creatorUsers.length].creatorProfile!;
    const request = await prisma.request.create({
      data: {
        startupId: startup.id,
        title: `${DEMO_PREFIX}${state.label}`,
        description: "A demo deal for building and checking the deal screens.",
        niche: "Beauty",
        productCategory: "Cosmetics",
        platform: "TikTok",
        deliverables: "1 TikTok video",
        budgetMinCents: 20_000,
        budgetMaxCents: 20_000,
        postBy: new Date(now.getTime() + 30 * DAY_MS),
      },
    });
    await prisma.campaignBriefing.create({
      data: {
        requestId: request.id,
        targetMarket: "DE",
        contentFormats: ["TIKTOK_VIDEO"],
        talkingPoints: "Show the texture and mention the code GLOW10.",
        requiredHashtags: ["glowco", "herbst"],
        disclosureLabels: ["Werbung", "Anzeige"],
        requirePaidPartnershipLabel: true,
        draftRequired: true,
        minLiveHours: 24,
        postingWindowEnd: new Date(now.getTime() + 30 * DAY_MS),
        usageType: "PAID_ADS",
        usageChannels: ["TIKTOK_SPARK_ADS"],
        usageDurationDays: 60,
        usageFeeCents: 5_000,
      },
    });
    const interest = await prisma.interest.create({
      data: {
        requestId: request.id,
        creatorId: creator.id,
        amountCents: 20_000,
        platformFeeCents: 2_000,
        payoutCents: 18_000,
        paymentStatus: "ACCEPTED",
        offerRole: "STARTUP",
        offeredAt: new Date(now.getTime() - 2 * DAY_MS),
        acceptedAt: new Date(now.getTime() - DAY_MS),
        offerBriefingVersion: 1,
      },
    });
    const full = await prisma.request.findUniqueOrThrow({ where: { id: request.id }, include: { startup: true, briefing: true } });
    const deal = await prisma.$transaction((tx) =>
      createDealInTx(tx, {
        id: interest.id,
        creatorId: interest.creatorId,
        amountCents: interest.amountCents,
        payoutCents: interest.payoutCents,
        platformFeeCents: interest.platformFeeCents,
        request: full,
        creator: { displayName: creator.displayName },
      }),
    );
    await build(state.status, deal.id, interest.id, brandUser.id, creatorUsers[index % creatorUsers.length].id);
    console.log(`  ${state.status.padEnd(18)} ${DEMO_PREFIX}${state.label}`);
  }
  console.log(`Demo deals ready: ${STATES.length} (brand startup1@example.com, creators creator1 to creator4; password123).`);
}

// Takes a deal from its start to `target` by the same steps the app takes, writing the rows a real deal would have.
async function build(target: DealStatus, dealId: string, interestId: string, brandUserId: string, creatorUserId: string) {
  const at = (offsetMs: number) => new Date(Date.now() + offsetMs);
  const set = (data: Prisma.DealUncheckedUpdateInput) => prisma.deal.update({ where: { id: dealId }, data: { statusChangedAt: new Date(), ...data } });
  const event = (kind: string, toStatus?: DealStatus) => prisma.dealEvent.create({ data: { dealId, kind, toStatus: toStatus ?? null } });

  if (target === "CONTRACT_PENDING") return;

  // Both sides confirm: the tax treatment is fixed and the escrow step opens.
  const signed = at(-20 * HOUR_MS);
  await prisma.deal.update({
    where: { id: dealId },
    data: { creatorSignedAt: signed, creatorSignedBy: creatorUserId, brandSignedAt: signed, brandSignedBy: brandUserId },
  });
  await completeContract(dealId, "STARTUP", brandUserId, "en");
  if (target === "AWAITING_ESCROW") return;

  if (target === "CANCELLED") {
    await prisma.interest.update({ where: { id: interestId }, data: { paymentStatus: "REFUNDED", paidAt: signed, refundedAt: new Date(), stripeChargeId: "ch_demo", stripeRefundId: "re_demo" } });
    await set({ status: "CANCELLED", cancelledAt: new Date(), cancelReason: "DRAFT_DEADLINE_MISSED" });
    await event("deal.cancelled", "CANCELLED");
    return;
  }

  await prisma.interest.update({ where: { id: interestId }, data: { paymentStatus: "HELD", paidAt: at(-18 * HOUR_MS), stripeChargeId: "ch_demo" } });
  await onEscrowFunded(dealId, at(-18 * HOUR_MS));
  if (target === "IN_PRODUCTION") return;

  const terms = parseTerms((await prisma.deal.findUniqueOrThrow({ where: { id: dealId } })).terms);
  const submittedAt = at(-10 * HOUR_MS);
  const draft = (data: Prisma.DealDraftUncheckedCreateInput) => prisma.dealDraft.create({ data });
  const baseDraft = { dealId, version: 1, kind: "VIDEO_PREVIEW" as const, url: "https://drive.example.com/glowco-draft", caption: CAPTION, disclosureConfirmed: true, submittedAt };

  if (target === "DRAFT_SUBMITTED") {
    await draft({ ...baseDraft, status: "SUBMITTED" });
    await set({ status: "DRAFT_SUBMITTED", draftReviewDueAt: reviewDueAt(submittedAt, terms.workflow.brandReviewDays) });
    await event("draft.submitted", "DRAFT_SUBMITTED");
    return;
  }
  if (target === "CHANGES_REQUESTED") {
    await draft({ ...baseDraft, status: "CHANGES_REQUESTED", feedback: "Please show the product label in the first three seconds.", reviewedAt: at(-4 * HOUR_MS) });
    await set({ status: "CHANGES_REQUESTED", revisionRound: 1, revisionDueAt: revisionDueAt(at(-4 * HOUR_MS)) });
    await event("draft.changes_requested", "CHANGES_REQUESTED");
    return;
  }

  // From here on the draft is approved.
  await draft({ ...baseDraft, status: "APPROVED", reviewedAt: at(-6 * HOUR_MS) });
  if (target === "DRAFT_APPROVED") {
    await set({ status: "DRAFT_APPROVED" });
    await event("draft.approved", "DRAFT_APPROVED");
    return;
  }
  if (target === "POST_SCHEDULED") {
    await set({ status: "POST_SCHEDULED", scheduledFor: at(2 * DAY_MS) });
    await event("post.scheduled", "POST_SCHEDULED");
    return;
  }

  const published = at(-3 * HOUR_MS);
  const post = (data: Partial<Prisma.DealPostUncheckedCreateInput>) =>
    prisma.dealPost.create({
      data: {
        dealId,
        format: "TIKTOK_VIDEO",
        url: TIKTOK_URL,
        caption: CAPTION,
        disclosureLabel: "Werbung",
        paidPartnershipLabel: true,
        disclosureInContent: true,
        hashtagsFound: ["glowco", "herbst"],
        publishedAt: published,
        submittedAt: published,
        ...data,
      },
    });

  if (target === "POST_SUBMITTED") {
    await post({ status: "PENDING", lastCheckedAt: at(-HOUR_MS) });
    await set({ status: "POST_SUBMITTED" });
    await event("post.submitted", "POST_SUBMITTED");
    return;
  }
  if (target === "REPOST_REQUIRED") {
    await post({ status: "REMOVED", source: "OEMBED", lastCheckedAt: at(-HOUR_MS), removedAt: at(-HOUR_MS), checkFailures: 2 });
    await set({ status: "REPOST_REQUIRED", firstLiveAt: published, graceUntil: at(47 * HOUR_MS) });
    await event("post.removed", "REPOST_REQUIRED");
    return;
  }

  // Live and verified. VERIFYING is inside the hold period, everything after it is past it.
  const holding = target === "VERIFYING";
  const firstLive = holding ? published : at(-3 * DAY_MS);
  await post({ status: "VERIFIED", source: "OEMBED", verifiedAt: firstLive, lastCheckedAt: at(-HOUR_MS) });
  const ends = holding ? verificationEndsAt(firstLive, terms.workflow.minLiveHours) : at(-HOUR_MS);
  const live = { firstLiveAt: firstLive, verificationEndsAt: ends, usageStartsAt: firstLive, usageExpiresAt: new Date(firstLive.getTime() + 60 * DAY_MS) };

  if (holding) {
    await set({ status: "VERIFYING", ...live });
    await event("post.verified", "VERIFYING");
    return;
  }
  if (target === "PAYOUT_PENDING") {
    await set({ status: "PAYOUT_PENDING", ...live, payoutEligibleAt: ends, usageDeliveredAt: at(-DAY_MS), sparkAdsCode: "DEMOSPARKCODE", sparkAdsCodeExpiresAt: at(90 * DAY_MS) });
    await event("payout.pending", "PAYOUT_PENDING");
    return;
  }
  if (target === "COMPLETED") {
    await prisma.interest.update({ where: { id: interestId }, data: { paymentStatus: "RELEASED", releasedAt: new Date(), stripeTransferId: "tr_demo" } });
    await set({ status: "COMPLETED", ...live, payoutEligibleAt: ends, completedAt: new Date(), usageDeliveredAt: at(-DAY_MS), sparkAdsCode: "DEMOSPARKCODE", sparkAdsCodeExpiresAt: at(90 * DAY_MS) });
    await event("payout.released", "COMPLETED");
    await issueDealInvoices(dealId);
    return;
  }
  if (target === "DISPUTED") {
    await set({ status: "DISPUTED", statusBeforeDispute: "VERIFYING", ...live });
    await prisma.interest.update({ where: { id: interestId }, data: { disputedAt: new Date() } });
    await prisma.dealDispute.create({
      data: { dealId, reason: "CONTENT_MISMATCH", details: "The video does not show the product the briefing asked for.", openedByRole: "STARTUP", openedByUserId: brandUserId },
    });
    await event("dispute.opened", "DISPUTED");
    return;
  }
  throw new Error(`No demo for ${target}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
