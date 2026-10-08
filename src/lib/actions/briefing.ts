"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { emailIsVerified, VERIFY_EMAIL_MESSAGE } from "@/lib/verified";
import { validateBriefing } from "@/lib/compliance/briefing";
import { parseBriefingForm, type FormValues } from "@/lib/compliance/briefing-form";
import { isPostFormat } from "@/lib/social/platforms";
import { dealLocale } from "@/lib/deals/copy";
import { failure, say, serializeIssues, type DealActionState } from "@/lib/deals/action-state";
import { hasErrors } from "@/lib/deals/issues";

// The brand's campaign rules for a request: formats, advertising label, workflow, exclusivity and usage rights. Saved only
// when nothing in it is unlawful or unworkable (see validateBriefing); warnings come back with the success. Deals made
// later freeze a copy, so editing never changes a deal that exists.
export async function saveBriefingAction(requestId: string, _prev: DealActionState, formData: FormData): Promise<DealActionState> {
  const session = await auth();
  const locale = dealLocale(await getLocale());
  if (!session || session.user.role !== "STARTUP") return { error: say(locale, "Not authorized.", "Nicht berechtigt.") };
  if (!(await emailIsVerified(session.user.id))) return { error: VERIFY_EMAIL_MESSAGE };

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true, budgetMaxCents: true, budgetMinCents: true, startup: { select: { userId: true } } },
  });
  if (!request || request.startup.userId !== session.user.id) {
    return { error: say(locale, "This request could not be found.", "Diese Anfrage wurde nicht gefunden.") };
  }

  const values: FormValues = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" ? v : undefined]));
  const input = parseBriefingForm(values);
  const budgetMax = request.budgetMaxCents ?? request.budgetMinCents ?? null;
  const issues = validateBriefing(input, { budgetMaxCents: budgetMax });
  if (hasErrors(issues)) return failure(issues, locale);

  const data = {
    targetMarket: input.targetMarket,
    contentFormats: input.contentFormats.filter(isPostFormat),
    talkingPoints: input.talkingPoints,
    doNots: input.doNots,
    requiredHashtags: input.requiredHashtags,
    requiredMentions: input.requiredMentions,
    disclosureLabels: input.disclosureLabels,
    requirePaidPartnershipLabel: input.requirePaidPartnershipLabel,
    draftRequired: input.draftRequired,
    draftDueDaysBeforePost: input.draftDueDaysBeforePost,
    brandReviewDays: input.brandReviewDays,
    maxRevisionRounds: input.maxRevisionRounds,
    postingWindowStart: input.postingWindowStart,
    postingWindowEnd: input.postingWindowEnd,
    minLiveHours: input.minLiveHours,
    exclusivityEnabled: input.exclusivity.enabled,
    exclusivityCategories: input.exclusivity.enabled ? input.exclusivity.categories : [],
    exclusivityCompetitors: input.exclusivity.enabled ? input.exclusivity.competitors : [],
    exclusivityDaysBefore: input.exclusivity.enabled ? input.exclusivity.daysBefore : 0,
    exclusivityDaysAfter: input.exclusivity.enabled ? input.exclusivity.daysAfter : 0,
    usageType: input.usage.type,
    usageChannels: input.usage.type === "ORGANIC_ONLY" ? [] : input.usage.channels,
    usageDurationDays: input.usage.durationDays,
    usageFeeCents: input.usage.feeCents,
    usageTerritory: input.usage.territory,
  };

  await prisma.$transaction([
    prisma.campaignBriefing.upsert({ where: { requestId }, create: { requestId, ...data }, update: data }),
    // The request's "post by" date follows the briefing's window, so the feed and the deal never show two dates.
    ...(input.postingWindowEnd ? [prisma.request.update({ where: { id: requestId }, data: { postBy: input.postingWindowEnd } })] : []),
  ]);

  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  return { success: true, issues: serializeIssues(issues, locale) };
}
