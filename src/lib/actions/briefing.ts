"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { emailIsVerified, VERIFY_EMAIL_MESSAGE } from "@/lib/verified";
import { validateBriefing } from "@/lib/compliance/briefing";
import { parseBriefingForm, type FormValues } from "@/lib/compliance/briefing-form";
import { DAY, takeToken } from "@/lib/rate-limit";
import { dealsEnabled } from "@/lib/deals/flag";
import { saveBriefing } from "@/lib/deals/briefing-store";
import { dealLocale } from "@/lib/deals/copy";
import { failure, say, serializeIssues, type DealActionState } from "@/lib/deals/action-state";
import { hasErrors } from "@/lib/deals/issues";

// The brand's campaign rules for a request: formats, advertising label, workflow, exclusivity and usage rights. Saved only
// when nothing in it is unlawful or unworkable (see validateBriefing); warnings come back with the success. Deals made
// later freeze a copy, so editing never changes a deal that exists. A save that changes the rules puts the open offers
// that were made under the old ones on hold until their proposer confirms them again (staleOffers says how many).
export async function saveBriefingAction(requestId: string, _prev: DealActionState, formData: FormData): Promise<DealActionState> {
  const session = await auth();
  const locale = dealLocale(await getLocale());
  if (!session || session.user.role !== "STARTUP") return { error: say(locale, "Not authorized.", "Nicht berechtigt.") };
  if (!dealsEnabled()) return { error: say(locale, "Briefings are not available yet.", "Briefings sind noch nicht verfügbar.") };
  if (!(await emailIsVerified(session.user.id))) return { error: VERIFY_EMAIL_MESSAGE };
  if (!(await takeToken("briefing-save", session.user.id, 60, DAY))) {
    return { error: say(locale, "You saved a lot of briefings today. Try again tomorrow.", "Du hast heute sehr viele Briefings gespeichert. Versuche es morgen erneut.") };
  }

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

  const saved = await saveBriefing(requestId, input);

  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  return { success: true, issues: serializeIssues(issues, locale), ...(saved.staleOffers > 0 ? { staleOffers: saved.staleOffers } : {}) };
}
