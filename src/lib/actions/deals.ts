"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { DisputeReason } from "@prisma/client";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { DAY, HOUR, takeToken } from "@/lib/rate-limit";
import { emailIsVerified, VERIFY_EMAIL_MESSAGE } from "@/lib/verified";
import { runAfter } from "@/lib/run-after";
import { sniffImage } from "@/lib/image-sniff";
import { businessReadiness } from "@/lib/tax/business";
import { validatePostDisclosure } from "@/lib/compliance/disclosure";
import { validateUsageDelivery, usageWindow } from "@/lib/compliance/usage-rights";
import { POST_FORMATS, isPostFormat, type PostFormat } from "@/lib/social/platforms";
import { parsePostUrl, urlFitsFormat, type ParsedPostUrl } from "@/lib/social/url";
import { dealLocale, type DealLocale } from "@/lib/deals/copy";
import { failure, say, serializeIssues, type DealActionState } from "@/lib/deals/action-state";
import { errorIssue, hasErrors, type Issue } from "@/lib/deals/issues";
import { cancelDeal, openDealDispute } from "@/lib/deals/payout";
import { dealHref, notifyDealParty } from "@/lib/deals/notify";
import { exclusivityIssuesFor } from "@/lib/deals/exclusivity";
import { completeContract } from "@/lib/deals/contract";
import { postDeadline, reviewDueAt, revisionDueAt } from "@/lib/deals/deadlines";
import { loadDealForParty, moveDeal, moveFailureMessage, recordDealEvent, type DealView } from "@/lib/deals/service";
import { canCheckByLink, verifyDealPosts } from "@/lib/deals/verification";
import type { DealTerms } from "@/lib/deals/terms";

type Role = "STARTUP" | "CREATOR";
type Party = { session: Session; role: Role; view: DealView; locale: DealLocale };

const MAX_PROOF_BYTES = 4 * 1024 * 1024;

// What a person can do on deals in a day, per kind of action. Generous for someone doing the work, a stop for a script or a button
// that keeps being pressed: every one of these writes to the deal and tells the other side. It only counts once the person has been
// let in (their own deal, their own role), so nobody can use up another's allowance.
const LIMITS = {
  sign: { bucket: "deal-sign", count: 60 },
  cancel: { bucket: "deal-cancel", count: 20 },
  draft: { bucket: "deal-draft", count: 30 },
  review: { bucket: "deal-review", count: 60 },
  schedule: { bucket: "deal-schedule", count: 30 },
  confirmPost: { bucket: "deal-confirm", count: 60 },
  usage: { bucket: "deal-usage", count: 20 },
  confirmUsage: { bucket: "deal-usage-confirm", count: 30 },
} as const;

type Limit = (typeof LIMITS)[keyof typeof LIMITS];

async function party(dealId: string, only?: Role, limit?: Limit): Promise<Party | { refusal: DealActionState }> {
  const session = await auth();
  const locale = dealLocale(await getLocale());
  const role = session?.user.role;
  if (!session || (role !== "STARTUP" && role !== "CREATOR") || (only && role !== only)) {
    return { refusal: { error: say(locale, "Not authorized.", "Nicht berechtigt.") } };
  }
  const view = await loadDealForParty(dealId, session.user.id, role);
  if (!view) return { refusal: { error: say(locale, "This deal could not be found.", "Dieser Deal wurde nicht gefunden.") } };
  if (limit && !(await takeToken(limit.bucket, session.user.id, limit.count, DAY))) {
    return { refusal: { error: say(locale, "That was a lot of attempts today. Try again tomorrow.", "Das waren heute sehr viele Versuche. Versuche es morgen erneut.") } };
  }
  return { session, role, view, locale };
}

function revalidateDeal(dealId: string) {
  revalidatePath(`/dashboard/deals/${dealId}`);
  revalidatePath("/dashboard/deals");
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
}

const wrongStage = (locale: DealLocale): DealActionState => ({
  error: say(locale, "That isn't possible at this stage of the deal.", "Das ist in dieser Phase des Deals nicht möglich."),
});

function moveRefusal(reason: Parameters<typeof moveFailureMessage>[0], locale: DealLocale): DealActionState {
  return { error: moveFailureMessage(reason, locale) };
}

function text(formData: FormData, name: string, max: number): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const checked = (formData: FormData, name: string) => formData.get(name) === "true" || formData.get(name) === "on";

function httpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------------------------------------------------

// Confirming the contract: the terms as frozen when the offer was accepted. The terms hash the person saw has to be the
// one on file. Needs complete business details; with the second signature the deal moves to the escrow step.
export async function signContractAction(dealId: string, termsHash: string): Promise<DealActionState> {
  const ctx = await party(dealId, undefined, LIMITS.sign);
  if ("refusal" in ctx) return ctx.refusal;
  const { session, role, view, locale } = ctx;
  if (!(await emailIsVerified(session.user.id))) return { error: VERIFY_EMAIL_MESSAGE };

  const { deal } = view;
  if (deal.status !== "CONTRACT_PENDING") return wrongStage(locale);
  if (deal.termsHash !== termsHash) {
    return { error: say(locale, "The terms changed. Reload the page and read them again.", "Die Bedingungen haben sich geändert. Lade die Seite neu und lies sie erneut.") };
  }

  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  const readiness = businessReadiness(profile, role);
  if (hasErrors(readiness)) return failure(readiness, locale, "/dashboard/business");

  const clashes = await exclusivityIssuesFor(dealId);
  if (hasErrors(clashes)) return failure(clashes, locale);

  const alreadySigned = role === "STARTUP" ? deal.brandSignedAt : deal.creatorSignedAt;
  if (!alreadySigned) {
    const now = new Date();
    const recorded = await prisma.deal.updateMany({
      where: { id: dealId, status: "CONTRACT_PENDING", ...(role === "STARTUP" ? { brandSignedAt: null } : { creatorSignedAt: null }) },
      data: role === "STARTUP" ? { brandSignedAt: now, brandSignedBy: session.user.id } : { creatorSignedAt: now, creatorSignedBy: session.user.id },
    });
    if (recorded.count !== 1) return moveRefusal("CONFLICT", locale);
    await prisma.$transaction((tx) =>
      recordDealEvent(tx, dealId, "contract.signed", { actor: role, actorUserId: session.user.id, data: { termsHash } }),
    );
  }

  const completed = await completeContract(dealId, role, session.user.id, locale);
  if (!completed.done && !completed.refusal) {
    const other = role === "STARTUP" ? view.creatorUserId : view.brandUserId;
    if (!alreadySigned) {
      await notifyDealParty(other, "contract_sign", { who: role === "STARTUP" ? view.brandName : view.creatorName, title: view.title }, dealHref(dealId));
    }
  }
  revalidateDeal(dealId);
  if (completed.refusal) return completed.refusal;
  return { success: true, issues: serializeIssues(clashes, locale) };
}

// A party backs out of a deal that has not produced anything yet. A brand may do so until the creator handed in a draft
// (the escrow is refunded in full); a creator may withdraw until their post is up. After that, a dispute is the way.
export async function cancelDealAction(dealId: string): Promise<DealActionState> {
  const ctx = await party(dealId, undefined, LIMITS.cancel);
  if ("refusal" in ctx) return ctx.refusal;
  const { session, role, view, locale } = ctx;
  const status = view.deal.status;

  const draftCount = await prisma.dealDraft.count({ where: { dealId } });
  const brandMay = status === "CONTRACT_PENDING" || status === "AWAITING_ESCROW" || (status === "IN_PRODUCTION" && draftCount === 0);
  const creatorMay = ["CONTRACT_PENDING", "AWAITING_ESCROW", "IN_PRODUCTION", "CHANGES_REQUESTED", "DRAFT_APPROVED", "POST_SCHEDULED"].includes(status);
  if (role === "STARTUP" ? !brandMay : !creatorMay) {
    return {
      error: say(
        locale,
        "The deal is too far along to cancel. If something is wrong, open a dispute.",
        "Der Deal ist zu weit fortgeschritten, um ihn abzubrechen. Wenn etwas nicht stimmt, eröffne einen Streitfall.",
      ),
    };
  }

  const result = await cancelDeal(dealId, role === "STARTUP" ? "CANCELLED_BY_BRAND" : "CANCELLED_BY_CREATOR", role, session.user.id);
  revalidateDeal(dealId);
  if (!result.ok) return { error: result.error === "NOT_FOUND" ? say(locale, "This deal could not be found.", "Dieser Deal wurde nicht gefunden.") : result.error };
  return { success: true };
}

// ---------------------------------------------------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------------------------------------------------

// Which booked format decides how a caption is judged: the first one that has a caption at all.
function captionFormat(terms: DealTerms): PostFormat | null {
  return terms.contentFormats.find((f) => POST_FORMATS[f].kind !== "story") ?? null;
}

const DRAFT_KINDS = ["SCRIPT", "VIDEO_PREVIEW", "IMAGE", "OTHER"] as const;

export async function submitDraftAction(dealId: string, _prev: DealActionState, formData: FormData): Promise<DealActionState> {
  const ctx = await party(dealId, "CREATOR", LIMITS.draft);
  if ("refusal" in ctx) return ctx.refusal;
  const { session, view, locale } = ctx;
  const { deal, terms } = view;

  if (!terms.workflow.draftRequired || (deal.status !== "IN_PRODUCTION" && deal.status !== "CHANGES_REQUESTED")) return wrongStage(locale);

  const kind = DRAFT_KINDS.find((k) => k === formData.get("kind")) ?? "OTHER";
  const rawUrl = text(formData, "url", 500);
  const url = rawUrl ? httpUrl(rawUrl) : null;
  const notes = text(formData, "notes", 2000);
  const caption = text(formData, "caption", 2200);
  const disclosureConfirmed = checked(formData, "disclosureConfirmed");

  const issues: Issue[] = [];
  if (rawUrl && !url) issues.push(errorIssue("POST_URL_INVALID", "url"));
  if (!url && !notes) {
    return { error: say(locale, "Add a link to the script or preview, or write it into the notes.", "Füge einen Link zum Skript oder zur Vorschau hinzu oder schreibe es in die Notizen."), issues: [] };
  }
  const format = captionFormat(terms);
  if (format) {
    // The platform label cannot be on yet, and the post does not exist: only the wording of the caption is judged here.
    issues.push(
      ...validatePostDisclosure({
        format,
        market: terms.targetMarket,
        caption,
        disclosureInContent: disclosureConfirmed,
        paidPartnershipLabel: true,
        agreed: { labels: terms.disclosure.labels, requirePaidPartnershipLabel: false, requiredHashtags: terms.requiredHashtags, requiredMentions: terms.requiredMentions },
      }).issues,
    );
  } else if (!disclosureConfirmed) {
    issues.push(errorIssue("DISCLOSURE_IN_CONTENT_REQUIRED", "disclosureConfirmed"));
  }
  if (hasErrors(issues)) return failure(issues, locale);

  const last = await prisma.dealDraft.findFirst({ where: { dealId }, orderBy: { version: "desc" }, select: { version: true } });
  const version = (last?.version ?? 0) + 1;
  const draft = await prisma.dealDraft.create({
    data: { dealId, version, kind, url, notes: notes || null, caption: caption || null, disclosureConfirmed },
  });
  const now = new Date();
  const dueAt = reviewDueAt(now, terms.workflow.brandReviewDays);
  const moved = await moveDeal(dealId, "SUBMIT_DRAFT", "CREATOR", {
    actorUserId: session.user.id,
    expectedFrom: deal.status,
    data: { draftReviewDueAt: dueAt, revisionDueAt: null },
    event: "draft.submitted",
    eventData: { version },
  });
  if (!moved.ok) {
    await prisma.dealDraft.delete({ where: { id: draft.id } }).catch(() => undefined);
    return moveRefusal(moved.reason, locale);
  }

  await notifyDealParty(view.brandUserId, "draft_submitted", { creator: view.creatorName, title: view.title, version, date: dueAt }, dealHref(dealId));
  revalidateDeal(dealId);
  return { success: true, issues: serializeIssues(issues, locale) };
}

export async function reviewDraftAction(dealId: string, _prev: DealActionState, formData: FormData): Promise<DealActionState> {
  const ctx = await party(dealId, "STARTUP", LIMITS.review);
  if ("refusal" in ctx) return ctx.refusal;
  const { session, view, locale } = ctx;
  const { deal, terms } = view;
  if (deal.status !== "DRAFT_SUBMITTED") return wrongStage(locale);

  const draft = await prisma.dealDraft.findFirst({ where: { dealId, status: "SUBMITTED" }, orderBy: { version: "desc" } });
  if (!draft) return wrongStage(locale);

  const decision = text(formData, "decision", 20);
  const feedback = text(formData, "feedback", 1000);
  const link = dealHref(dealId);
  const needFeedback = { error: say(locale, "Tell the creator what to change, in a sentence or two.", "Sag dem Creator in ein, zwei Sätzen, was geändert werden soll.") };

  if (decision === "APPROVE") {
    const moved = await moveDeal(dealId, "APPROVE_DRAFT", "STARTUP", { actorUserId: session.user.id, expectedFrom: "DRAFT_SUBMITTED", event: "draft.approved" });
    if (!moved.ok) return moveRefusal(moved.reason, locale);
    await prisma.dealDraft.update({ where: { id: draft.id }, data: { status: "APPROVED", reviewedAt: new Date(), feedback: feedback || null } });
    await notifyDealParty(view.creatorUserId, "draft_approved", { brand: view.brandName, title: view.title }, link);
  } else if (decision === "CHANGES") {
    if (feedback.length < 10) return needFeedback;
    const round = deal.revisionRound + 1;
    if (round > terms.workflow.maxRevisionRounds) {
      return {
        error: say(
          locale,
          `The agreed ${terms.workflow.maxRevisionRounds} revision rounds are used up. Approve the draft, or reject it to have the deal reviewed.`,
          `Die vereinbarten ${terms.workflow.maxRevisionRounds} Korrekturrunden sind aufgebraucht. Gib den Entwurf frei oder lehne ihn ab, damit der Deal geprüft wird.`,
        ),
      };
    }
    const now = new Date();
    const dueAt = revisionDueAt(now);
    const moved = await moveDeal(dealId, "REQUEST_CHANGES", "STARTUP", {
      actorUserId: session.user.id,
      expectedFrom: "DRAFT_SUBMITTED",
      data: { revisionRound: round, revisionDueAt: dueAt, draftReviewDueAt: null },
      event: "draft.changes_requested",
      eventData: { round },
    });
    if (!moved.ok) return moveRefusal(moved.reason, locale);
    await prisma.dealDraft.update({ where: { id: draft.id }, data: { status: "CHANGES_REQUESTED", reviewedAt: now, feedback } });
    await notifyDealParty(view.creatorUserId, "draft_changes", { brand: view.brandName, title: view.title, feedback: feedback.slice(0, 200), date: dueAt }, link);
  } else if (decision === "REJECT") {
    if (feedback.length < 10) return needFeedback;
    await prisma.dealDraft.update({ where: { id: draft.id }, data: { status: "REJECTED", reviewedAt: new Date(), feedback } });
    const opened = await openDealDispute(dealId, { reason: "DRAFT_REJECTED", details: feedback, actor: "STARTUP", actorUserId: session.user.id });
    if (!opened.ok) return moveRefusal(opened.error === "CONFLICT" ? "CONFLICT" : "NOT_ALLOWED", locale);
    await notifyDealParty(view.creatorUserId, "draft_rejected", { brand: view.brandName, title: view.title }, link);
  } else {
    return wrongStage(locale);
  }
  revalidateDeal(dealId);
  return { success: true };
}

// ---------------------------------------------------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------------------------------------------------

export async function schedulePostAction(dealId: string, _prev: DealActionState, formData: FormData): Promise<DealActionState> {
  const ctx = await party(dealId, "CREATOR", LIMITS.schedule);
  if ("refusal" in ctx) return ctx.refusal;
  const { session, view, locale } = ctx;
  const { deal, terms } = view;

  const okStage = deal.status === "DRAFT_APPROVED" || deal.status === "POST_SCHEDULED" || (deal.status === "IN_PRODUCTION" && !terms.workflow.draftRequired);
  if (!okStage) {
    return deal.status === "IN_PRODUCTION"
      ? { error: say(locale, "Submit a draft first: the brand has to approve it before you schedule the post.", "Reiche zuerst einen Entwurf ein: Die Marke muss ihn freigeben, bevor du den Post planst.") }
      : wrongStage(locale);
  }

  const scheduledFor = new Date(text(formData, "scheduledFor", 40));
  const now = new Date();
  const lastDraft = await prisma.dealDraft.findFirst({ where: { dealId, status: "APPROVED" }, orderBy: { reviewedAt: "desc" }, select: { reviewedAt: true } });
  const latest = deal.postWindowEnd ? postDeadline(deal.postWindowEnd, lastDraft?.reviewedAt ?? null) : null;
  if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() < now.getTime() - 5 * 60 * 1000 || (latest && scheduledFor.getTime() > latest.getTime())) {
    return failure([errorIssue("POST_DATE_INVALID", "scheduledFor")], locale);
  }

  const clashes = await exclusivityIssuesFor(dealId, { scheduledFor });
  if (hasErrors(clashes)) return failure(clashes, locale);

  const moved = await moveDeal(dealId, "SCHEDULE_POST", "CREATOR", {
    actorUserId: session.user.id,
    expectedFrom: deal.status,
    data: { scheduledFor },
    event: "post.scheduled",
    eventData: { scheduledFor: scheduledFor.toISOString() },
  });
  if (!moved.ok) return moveRefusal(moved.reason, locale);
  await notifyDealParty(view.brandUserId, "post_scheduled", { creator: view.creatorName, title: view.title, date: scheduledFor }, dealHref(dealId));
  revalidateDeal(dealId);
  return { success: true, issues: serializeIssues(clashes, locale) };
}

async function readProof(entry: FormDataEntryValue | null): Promise<{ ok: true; proof: { contentType: string; data: Uint8Array<ArrayBuffer>; sha256: string } | null } | { ok: false }> {
  if (!(entry instanceof File) || entry.size === 0) return { ok: true, proof: null };
  if (entry.size > MAX_PROOF_BYTES) return { ok: false };
  const data = new Uint8Array(await entry.arrayBuffer());
  const contentType = sniffImage(data);
  if (!contentType) return { ok: false };
  return { ok: true, proof: { contentType, data, sha256: createHash("sha256").update(data).digest("hex") } };
}

// The creator reports a published post: the link (or, for Stories and platforms that cannot be asked, a screenshot), the
// caption and the disclosure switches. Everything the briefing demands is checked before the brand sees it; the platform
// check follows in the background.
export async function submitDealPostAction(dealId: string, _prev: DealActionState, formData: FormData): Promise<DealActionState> {
  const ctx = await party(dealId, "CREATOR");
  if ("refusal" in ctx) return ctx.refusal;
  const { session, view, locale } = ctx;
  const { deal, terms } = view;

  const okStage = ["DRAFT_APPROVED", "POST_SCHEDULED", "POST_SUBMITTED", "REPOST_REQUIRED"].includes(deal.status) || (deal.status === "IN_PRODUCTION" && !terms.workflow.draftRequired);
  if (!okStage) {
    return deal.status === "IN_PRODUCTION"
      ? { error: say(locale, "Submit a draft first: the brand has to approve it before you post.", "Reiche zuerst einen Entwurf ein: Die Marke muss ihn freigeben, bevor du postest.") }
      : wrongStage(locale);
  }

  // Every report can store a proof image and calls a platform: a person with a handful of formats never gets near this.
  if (!(await takeToken("deal-post", session.user.id, 30, DAY))) {
    return { error: say(locale, "You reported a lot of posts today. Try again tomorrow.", "Du hast heute sehr viele Posts gemeldet. Versuche es morgen erneut.") };
  }

  const formatCode = text(formData, "format", 40);
  if (!isPostFormat(formatCode) || !terms.contentFormats.includes(formatCode)) {
    return { error: say(locale, "Choose one of the booked formats.", "Wähle eines der gebuchten Formate.") };
  }
  const info = POST_FORMATS[formatCode];
  const issues: Issue[] = [];

  // The link
  const rawUrl = text(formData, "url", 500);
  let parsed: ParsedPostUrl | null = null;
  if (rawUrl || info.verification === "link") {
    const result = parsePostUrl(rawUrl);
    if (!result.ok) issues.push(errorIssue(result.code, "url"));
    else if (!urlFitsFormat(result.post, formatCode)) issues.push(errorIssue("POST_URL_FORMAT_MISMATCH", "url", { format: info.label }));
    else parsed = result.post;
  }
  if (parsed) {
    const duplicate = await prisma.dealPost.findFirst({
      where: { dealId, externalId: parsed.externalId, status: { notIn: ["REMOVED", "REJECTED"] } },
      select: { id: true },
    });
    if (duplicate) issues.push(errorIssue("POST_URL_DUPLICATE", "url"));
  }

  // The proof: required when the platform cannot be asked
  const needsProof = info.verification === "proof" || !canCheckByLink(formatCode);
  const proofResult = await readProof(formData.get("proof"));
  if (!proofResult.ok) issues.push(errorIssue("POST_PROOF_INVALID", "proof"));
  else if (needsProof && !proofResult.proof) issues.push(errorIssue("POST_PROOF_REQUIRED", "proof"));

  // The advertising disclosure
  const caption = text(formData, "caption", 2200);
  const paidPartnershipLabel = checked(formData, "paidPartnershipLabel");
  const disclosureInContent = checked(formData, "disclosureInContent");
  const disclosure = validatePostDisclosure({
    format: formatCode,
    market: terms.targetMarket,
    caption,
    disclosureInContent,
    paidPartnershipLabel,
    agreed: { labels: terms.disclosure.labels, requirePaidPartnershipLabel: terms.disclosure.requirePaidPartnershipLabel, requiredHashtags: terms.requiredHashtags, requiredMentions: terms.requiredMentions },
  });
  issues.push(...disclosure.issues);

  // When it went live, and whether that collides with somebody else's exclusivity
  const publishedRaw = text(formData, "publishedAt", 40);
  const publishedAt = publishedRaw ? new Date(publishedRaw) : new Date();
  const now = new Date();
  if (Number.isNaN(publishedAt.getTime()) || publishedAt.getTime() > now.getTime() + 5 * 60 * 1000) issues.push(errorIssue("POST_DATE_INVALID", "publishedAt"));
  else issues.push(...(await exclusivityIssuesFor(dealId, { publishedAt })));

  if (hasErrors(issues)) return failure(issues, locale);

  const proof = proofResult.ok ? proofResult.proof : null;
  const post = await prisma.dealPost.create({
    data: {
      dealId,
      format: formatCode,
      url: parsed?.canonicalUrl ?? null,
      externalId: parsed?.externalId ?? null,
      source: needsProof ? "PROOF" : "MANUAL",
      caption: caption || null,
      disclosureLabel: disclosure.labelUsed,
      paidPartnershipLabel,
      disclosureInContent,
      hashtagsFound: disclosure.hashtags,
      publishedAt,
      ...(proof ? { proofs: { create: { contentType: proof.contentType, sha256: proof.sha256, data: proof.data } } } : {}),
    },
  });

  const moved = await moveDeal(dealId, "SUBMIT_POST", "CREATOR", {
    actorUserId: session.user.id,
    expectedFrom: deal.status,
    data: { graceUntil: null },
    event: "post.submitted",
    eventData: { postId: post.id, format: formatCode },
  });
  if (!moved.ok) {
    await prisma.dealPost.delete({ where: { id: post.id } }).catch(() => undefined);
    return moveRefusal(moved.reason, locale);
  }
  // A newer submission for the same format replaces the ones that were never confirmed.
  await prisma.dealPost.updateMany({
    where: { dealId, format: formatCode, id: { not: post.id }, status: { in: ["PENDING", "UNREACHABLE"] } },
    data: { status: "REJECTED", note: "replaced" },
  });

  if (needsProof) {
    await notifyDealParty(view.brandUserId, "post_confirm_needed", { creator: view.creatorName, title: view.title, date: new Date(now.getTime() + terms.workflow.brandReviewDays * DAY) }, dealHref(dealId));
  } else {
    await notifyDealParty(view.brandUserId, "post_submitted", { creator: view.creatorName, title: view.title }, dealHref(dealId));
    runAfter(() => verifyDealPosts(dealId));
  }
  revalidateDeal(dealId);
  return { success: true, issues: serializeIssues(issues, locale) };
}

// The brand confirms a post that cannot be checked by link (a Story, or Instagram without a Meta token) after looking at
// the proof.
export async function confirmPostAction(postId: string): Promise<DealActionState> {
  const session = await auth();
  const locale = dealLocale(await getLocale());
  if (!session || session.user.role !== "STARTUP") return { error: say(locale, "Not authorized.", "Nicht berechtigt.") };

  const post = await prisma.dealPost.findUnique({ where: { id: postId }, select: { id: true, dealId: true, source: true, status: true } });
  if (!post) return { error: say(locale, "This post could not be found.", "Dieser Post wurde nicht gefunden.") };
  const ctx = await party(post.dealId, "STARTUP", LIMITS.confirmPost);
  if ("refusal" in ctx) return ctx.refusal;
  if (post.source !== "PROOF" || post.status !== "PENDING" || ctx.view.deal.status !== "POST_SUBMITTED") return wrongStage(locale);

  await prisma.dealPost.update({ where: { id: postId }, data: { brandConfirmedAt: new Date() } });
  await verifyDealPosts(post.dealId);
  revalidateDeal(post.dealId);
  return { success: true };
}

// Either side asks for a fresh look at the posts instead of waiting for the daily check.
export async function recheckPostsAction(dealId: string): Promise<DealActionState> {
  const ctx = await party(dealId);
  if ("refusal" in ctx) return ctx.refusal;
  const { session, locale } = ctx;
  if (!(await takeToken("deal-recheck", session.user.id, 6, HOUR))) {
    return { error: say(locale, "You checked a lot just now. Try again later.", "Du hast gerade sehr oft geprüft. Versuche es später erneut.") };
  }
  await verifyDealPosts(dealId);
  revalidateDeal(dealId);
  return { success: true };
}

// ---------------------------------------------------------------------------------------------------------------------
// Usage rights
// ---------------------------------------------------------------------------------------------------------------------

// The creator hands over what lets the brand run the post as an ad: the Spark Ads code (TikTok) and/or the confirmation
// that the partner-ad permission is granted (Meta, YouTube, whitelisting). The payout waits for it.
export async function deliverUsageAction(dealId: string, _prev: DealActionState, formData: FormData): Promise<DealActionState> {
  const ctx = await party(dealId, "CREATOR", LIMITS.usage);
  if ("refusal" in ctx) return ctx.refusal;
  const { session, view, locale } = ctx;
  const { deal, terms } = view;
  if (terms.usage.type !== "PAID_ADS" || !["POST_SUBMITTED", "VERIFYING", "REPOST_REQUIRED", "PAYOUT_PENDING", "DISPUTED"].includes(deal.status)) return wrongStage(locale);

  const code = text(formData, "sparkAdsCode", 200) || null;
  const expiryRaw = text(formData, "sparkAdsCodeExpiresAt", 20);
  const codeExpiresAt = expiryRaw ? new Date(`${expiryRaw}T23:59:59Z`) : null;
  const permissionConfirmed = checked(formData, "permissionConfirmed");

  const endsAt = deal.usageExpiresAt ?? (terms.usage.durationDays ? usageWindow(new Date(), terms.usage.durationDays).expiresAt : null);
  const issues = validateUsageDelivery(terms.usage, { sparkAdsCode: code, sparkAdsCodeExpiresAt: codeExpiresAt && !Number.isNaN(codeExpiresAt.getTime()) ? codeExpiresAt : null, permissionConfirmed }, endsAt);
  if (hasErrors(issues)) return failure(issues, locale);

  await prisma.$transaction([
    prisma.deal.update({
      where: { id: dealId },
      data: { sparkAdsCode: code, sparkAdsCodeExpiresAt: codeExpiresAt, usageDeliveredAt: new Date() },
    }),
    prisma.dealEvent.create({ data: { dealId, kind: "usage.delivered", actorRole: "CREATOR", actorUserId: session.user.id } }),
  ]);
  await notifyDealParty(view.brandUserId, "usage_delivered", { creator: view.creatorName, title: view.title }, dealHref(dealId));
  revalidateDeal(dealId);
  return { success: true };
}

export async function confirmUsageAction(dealId: string): Promise<DealActionState> {
  const ctx = await party(dealId, "STARTUP", LIMITS.confirmUsage);
  if ("refusal" in ctx) return ctx.refusal;
  const { session, view, locale } = ctx;
  if (!view.deal.usageDeliveredAt) return wrongStage(locale);
  await prisma.$transaction([
    prisma.deal.update({ where: { id: dealId }, data: { usageConfirmedAt: new Date() } }),
    prisma.dealEvent.create({ data: { dealId, kind: "usage.confirmed", actorRole: "STARTUP", actorUserId: session.user.id } }),
  ]);
  revalidateDeal(dealId);
  return { success: true };
}

// ---------------------------------------------------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------------------------------------------------

// (A chargeback is opened by the system, never by a person.)
const DISPUTE_REASONS: DisputeReason[] = ["MISSED_DEADLINE", "DRAFT_REJECTED", "POST_REMOVED", "DISCLOSURE_MISSING", "CONTENT_MISMATCH", "USAGE_RIGHTS_MISSING", "OTHER"];

export async function openDisputeAction(dealId: string, _prev: DealActionState, formData: FormData): Promise<DealActionState> {
  const ctx = await party(dealId);
  if ("refusal" in ctx) return ctx.refusal;
  const { session, role, locale } = ctx;

  const reason = DISPUTE_REASONS.find((r) => r === formData.get("reason"));
  const details = text(formData, "details", 1000);
  if (!reason) return { error: say(locale, "Choose what the problem is.", "Wähle, worin das Problem besteht.") };
  if (details.length < 10) return { error: say(locale, "Describe the problem in a sentence or two.", "Beschreibe das Problem in ein, zwei Sätzen.") };
  if (!(await takeToken("deal-dispute", session.user.id, 5, DAY))) {
    return { error: say(locale, "You opened several disputes today. Try again tomorrow.", "Du hast heute mehrere Streitfälle eröffnet. Versuche es morgen erneut.") };
  }

  const opened = await openDealDispute(dealId, { reason, details, actor: role, actorUserId: session.user.id });
  if (!opened.ok) return opened.error === "CONFLICT" ? moveRefusal("CONFLICT", locale) : wrongStage(locale);
  revalidateDeal(dealId);
  return { success: true };
}
