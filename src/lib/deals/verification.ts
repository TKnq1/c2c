import type { DealPost, DealStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DAY_MS, DEAL_POLICY, HOUR_MS } from "@/lib/deals/policy";
import { verificationEndsAt } from "@/lib/deals/deadlines";
import { loadDeal, moveDeal, recordDealEvent, type DealView } from "@/lib/deals/service";
import { dealHref, notifyDealParty } from "@/lib/deals/notify";
import { scanCaption } from "@/lib/compliance/disclosure";
import { usageWindow } from "@/lib/compliance/usage-rights";
import { POST_FORMATS, isPostFormat, type PostFormat } from "@/lib/social/platforms";
import { checkPostLive } from "@/lib/social/oembed";
import { parsePostUrl } from "@/lib/social/url";

// Checking that the posts of a deal are really there, and what that does to the deal. Two halves:
//  - verifyDealPosts asks the platforms about every post and records what they said;
//  - evaluateDeal looks at the posts as they now stand and moves the deal: all booked formats live -> the hold window
//    starts; a post gone -> the creator gets a grace period to publish it again.

const CHECKED_STATUSES: DealStatus[] = ["POST_SUBMITTED", "VERIFYING"];

// Whether the platform can be asked about a post at all. Instagram needs a Meta token; without one, a screenshot the
// brand confirms stands in for the check.
export function canCheckByLink(format: PostFormat, env: Record<string, string | undefined> = process.env): boolean {
  const info = POST_FORMATS[format];
  if (info.verification === "proof") return false;
  if (info.platform === "Instagram") return Boolean(env.META_OEMBED_TOKEN?.trim());
  return true;
}

export type VerifyOutcome = { dealId: string; checked: number; status: DealStatus | null };

async function checkPost(view: DealView, post: DealPost, now: Date): Promise<void> {
  const format = isPostFormat(post.format) ? post.format : null;
  if (!format) return;
  const terms = view.terms;

  // Proof posts: the brand confirms, or the review time runs out and the proof counts as confirmed.
  if (post.source === "PROOF") {
    if (post.status !== "PENDING") return;
    const confirmedAt = post.brandConfirmedAt;
    const autoAt = new Date(post.submittedAt.getTime() + terms.workflow.brandReviewDays * DAY_MS);
    if (confirmedAt || now.getTime() >= autoAt.getTime()) {
      await prisma.dealPost.update({
        where: { id: post.id },
        data: { status: "VERIFIED", verifiedAt: confirmedAt ?? now, lastCheckedAt: now, note: confirmedAt ? post.note : "auto_confirmed" },
      });
    } else {
      await prisma.dealPost.update({ where: { id: post.id }, data: { lastCheckedAt: now } });
    }
    return;
  }

  const parsed = post.url ? parsePostUrl(post.url) : null;
  if (!parsed || !parsed.ok) {
    await prisma.dealPost.update({ where: { id: post.id }, data: { lastCheckedAt: now } });
    return;
  }

  const live = await checkPostLive(parsed.post);
  if (live.state === "LIVE") {
    await prisma.dealPost.update({
      where: { id: post.id },
      data: {
        status: "VERIFIED",
        source: live.source === "API" ? "API" : "OEMBED",
        verifiedAt: post.verifiedAt ?? now,
        lastCheckedAt: now,
        checkFailures: 0,
        removedAt: null,
      },
    });
    if (live.metrics && Object.values(live.metrics).some((v) => v !== undefined)) {
      await prisma.dealPostMetric.create({ data: { postId: post.id, source: live.source.toLowerCase(), ...live.metrics } });
    }
    // The caption the platform shows is the one that counts. TikTok's title is the caption and YouTube's API gives the
    // description; a plain YouTube title or an Instagram answer says nothing about the label, so those are not judged.
    const reliable = live.source === "API" || POST_FORMATS[format].platform === "TikTok";
    if (live.caption && reliable && post.note !== "caption_check_failed") {
      const found = scanCaption(live.caption, terms.targetMarket).accepted.length > 0;
      if (!found) {
        await prisma.dealPost.update({ where: { id: post.id }, data: { note: "caption_check_failed" } });
        await prisma.$transaction((tx) => recordDealEvent(tx, view.deal.id, "disclosure.check_failed", { data: { postId: post.id } }));
        const labels = terms.disclosure.labels.join(" / ");
        for (const userId of [view.creatorUserId, view.brandUserId]) {
          await notifyDealParty(userId, "disclosure_warning", { title: view.title, labels }, dealHref(view.deal.id));
        }
      }
    }
    return;
  }

  if (live.state === "GONE") {
    const failures = post.checkFailures + 1;
    const removed = failures >= DEAL_POLICY.removalConfirmFailures;
    await prisma.dealPost.update({
      where: { id: post.id },
      data: { checkFailures: failures, lastCheckedAt: now, ...(removed ? { status: "REMOVED", removedAt: now } : {}) },
    });
    return;
  }

  // Unknown: no verdict. A post that was never confirmed just stays pending.
  await prisma.dealPost.update({ where: { id: post.id }, data: { lastCheckedAt: now, ...(post.status === "PENDING" ? { status: "PENDING" } : {}) } });
}

// Moves the deal according to what its posts look like now. Safe to call whenever a post changed.
export async function evaluateDeal(dealId: string, now = new Date()): Promise<DealStatus | null> {
  const view = await loadDeal(dealId);
  if (!view || !CHECKED_STATUSES.includes(view.deal.status)) return null;
  const posts = await prisma.dealPost.findMany({ where: { dealId } });
  const { terms } = view;

  const removed = posts.filter((p) => p.status === "REMOVED");
  const live = posts.filter((p) => p.status === "VERIFIED");
  // A removed post only matters while nothing has replaced it: a repost of the same format is a new row.
  const unreplaced = removed.filter((gone) => !posts.some((p) => p.format === gone.format && p.status !== "REMOVED" && p.status !== "REJECTED" && p.submittedAt > gone.submittedAt));

  if (unreplaced.length > 0) {
    const graceUntil = new Date(now.getTime() + DEAL_POLICY.repostGraceHours * HOUR_MS);
    const moved = await moveDeal(dealId, "POST_REMOVED", "SYSTEM", {
      expectedFrom: view.deal.status,
      data: { graceUntil },
      eventData: { postIds: unreplaced.map((p) => p.id) },
    });
    if (moved.ok) {
      await notifyDealParty(view.creatorUserId, "post_removed_creator", { title: view.title, date: graceUntil }, dealHref(dealId));
      await notifyDealParty(view.brandUserId, "post_removed_brand", { title: view.title, creator: view.creatorName, date: graceUntil }, dealHref(dealId));
      return moved.to;
    }
    return null;
  }

  if (view.deal.status !== "POST_SUBMITTED") return view.deal.status;

  const wanted: string[] = terms.contentFormats.length > 0 ? terms.contentFormats : [];
  const covered = wanted.length > 0 ? wanted.every((f) => live.some((p) => p.format === f)) : live.length > 0;
  if (!covered) return view.deal.status;

  const endsAt = verificationEndsAt(now, terms.workflow.minLiveHours);
  const usage = terms.usage.type !== "ORGANIC_ONLY" && terms.usage.durationDays ? usageWindow(now, terms.usage.durationDays) : null;
  const moved = await moveDeal(dealId, "POST_VERIFIED", "SYSTEM", {
    expectedFrom: "POST_SUBMITTED",
    data: {
      firstLiveAt: now,
      verificationEndsAt: endsAt,
      graceUntil: null,
      ...(usage ? { usageStartsAt: usage.startsAt, usageExpiresAt: usage.expiresAt } : {}),
    },
  });
  if (!moved.ok) return null;
  await notifyDealParty(view.creatorUserId, "post_verified_creator", { title: view.title, date: endsAt }, dealHref(dealId));
  await notifyDealParty(view.brandUserId, "post_verified_brand", { title: view.title, date: endsAt }, dealHref(dealId));
  return moved.to;
}

// Asks the platforms about every open post of the deal and moves the deal on.
export async function verifyDealPosts(dealId: string, now = new Date()): Promise<VerifyOutcome> {
  const view = await loadDeal(dealId);
  if (!view || !CHECKED_STATUSES.includes(view.deal.status)) return { dealId, checked: 0, status: view?.deal.status ?? null };

  const posts = await prisma.dealPost.findMany({ where: { dealId, status: { in: ["PENDING", "VERIFIED", "UNREACHABLE"] } } });
  for (const post of posts) {
    try {
      await checkPost(view, post, now);
    } catch (err) {
      console.error("Checking a post failed", { postId: post.id, err });
    }
  }
  const status = await evaluateDeal(dealId, now);
  return { dealId, checked: posts.length, status };
}

// A removal reported by the platform's own events needs no second look: the post is marked and the deal moves on.
export async function markPostRemoved(postId: string, now = new Date()): Promise<void> {
  const post = await prisma.dealPost.findUnique({ where: { id: postId } });
  if (!post || post.status === "REMOVED") return;
  await prisma.dealPost.update({ where: { id: postId }, data: { status: "REMOVED", removedAt: now, lastCheckedAt: now } });
  await evaluateDeal(post.dealId, now);
}

export async function markPostPublished(postId: string, now = new Date()): Promise<void> {
  const post = await prisma.dealPost.findUnique({ where: { id: postId } });
  if (!post || post.status !== "PENDING") return;
  await prisma.dealPost.update({ where: { id: postId }, data: { status: "VERIFIED", source: "WEBHOOK", verifiedAt: now, lastCheckedAt: now } });
  await evaluateDeal(post.dealId, now);
}
