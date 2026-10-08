"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { HOUR, takeToken } from "@/lib/rate-limit";
import { dealLocale } from "@/lib/deals/copy";
import { failure, say, serializeIssues, type BusinessActionState } from "@/lib/deals/action-state";
import { hasErrors } from "@/lib/deals/issues";
import { SELF_BILLING_VERSION, TRADER_CERT_VERSION, validateBusinessInput, type BusinessInput } from "@/lib/tax/business";
import { normalizeVatId } from "@/lib/tax/vat-id";
import { verifyStoredVatId } from "@/lib/tax/verify-profile";
import { completePendingContracts } from "@/lib/deals/contract";

function field(formData: FormData, name: string, max: number): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const checked = (formData: FormData, name: string) => formData.get(name) === "true" || formData.get(name) === "on";

function revalidateBusiness() {
  revalidatePath("/dashboard/business");
  revalidatePath("/dashboard/deals", "layout");
}

// The business details every deal needs: who the trader is (DSA Art. 30 / P2B transparency), how they are taxed and what
// they confirmed. Saved only when complete; a VAT ID outside Germany is checked with VIES right away.
export async function saveBusinessProfileAction(_prev: BusinessActionState, formData: FormData): Promise<BusinessActionState> {
  const session = await auth();
  const locale = dealLocale(await getLocale());
  if (!session || (session.user.role !== "STARTUP" && session.user.role !== "CREATOR")) {
    return { error: say(locale, "Not authorized.", "Nicht berechtigt.") };
  }
  const role = session.user.role;
  const userId = session.user.id;
  // Saving writes the profile and may ask VIES: a person filling in a form does this a handful of times, not dozens.
  if (!(await takeToken("business-save", userId, 30, HOUR))) {
    return { error: say(locale, "You saved your details a lot just now. Try again later.", "Du hast deine Angaben gerade sehr oft gespeichert. Versuche es später erneut.") };
  }

  const vatInput = field(formData, "vatId", 30);
  const input: BusinessInput = {
    legalName: field(formData, "legalName", 160),
    businessType: field(formData, "businessType", 30),
    country: field(formData, "country", 2).toUpperCase(),
    addressLine1: field(formData, "addressLine1", 160),
    addressLine2: field(formData, "addressLine2", 160) || null,
    postalCode: field(formData, "postalCode", 20),
    city: field(formData, "city", 100),
    phone: field(formData, "phone", 40) || null,
    registerNumber: field(formData, "registerNumber", 60) || null,
    taxNumber: field(formData, "taxNumber", 40) || null,
    vatId: vatInput ? normalizeVatId(vatInput) : null,
    smallBusinessExempt: role === "CREATOR" && checked(formData, "smallBusinessExempt"),
    traderSelfCertified: checked(formData, "traderSelfCertified"),
    selfBillingAccepted: role === "CREATOR" && checked(formData, "selfBillingAccepted"),
  };

  const issues = validateBusinessInput(input, role);
  if (hasErrors(issues)) return failure(issues, locale);

  const existing = await prisma.businessProfile.findUnique({ where: { userId } });
  const vatChanged = (existing?.vatId ?? null) !== input.vatId;
  const now = new Date();
  const data = {
    legalName: input.legalName,
    businessType: input.businessType,
    country: input.country,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    postalCode: input.postalCode,
    city: input.city,
    phone: input.phone,
    registerNumber: input.registerNumber,
    taxNumber: input.taxNumber,
    vatId: input.vatId,
    smallBusinessExempt: input.smallBusinessExempt,
    // A confirmation counts for the wording it was given for: a new version of the text asks again.
    traderSelfCertifiedAt: existing?.traderSelfCertifiedAt && existing.traderCertVersion === TRADER_CERT_VERSION ? existing.traderSelfCertifiedAt : now,
    traderCertVersion: TRADER_CERT_VERSION,
    selfBillingAcceptedAt:
      role === "CREATOR" ? (existing?.selfBillingAcceptedAt && existing.selfBillingVersion === SELF_BILLING_VERSION ? existing.selfBillingAcceptedAt : now) : null,
    selfBillingVersion: role === "CREATOR" ? SELF_BILLING_VERSION : null,
    ...(vatChanged
      ? { vatIdStatus: "UNCHECKED" as const, vatIdCheckedAt: null, vatIdConsultationNumber: null, vatIdRegisteredName: null, vatIdRegisteredAddress: null }
      : {}),
  };
  await prisma.businessProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });

  let vatStatus = vatChanged || !existing ? "UNCHECKED" : existing.vatIdStatus;
  if (input.vatId && vatStatus !== "VALID" && (await takeToken("vies", userId, 10, HOUR))) {
    vatStatus = (await verifyStoredVatId(userId))?.status ?? vatStatus;
  }
  // A contract both sides signed but that waited for these details can go on now.
  await completePendingContracts(userId, locale).catch((err) => console.error("Completing pending contracts failed", err));
  revalidateBusiness();
  return { success: true, issues: serializeIssues(issues, locale), vatStatus: input.vatId ? (vatStatus as NonNullable<BusinessActionState>["vatStatus"]) : undefined };
}

// Runs the VIES check again, e.g. after it was unavailable.
export async function checkVatIdAction(_prev: BusinessActionState): Promise<BusinessActionState> {
  const session = await auth();
  const locale = dealLocale(await getLocale());
  if (!session || (session.user.role !== "STARTUP" && session.user.role !== "CREATOR")) {
    return { error: say(locale, "Not authorized.", "Nicht berechtigt.") };
  }
  if (!(await takeToken("vies", session.user.id, 10, HOUR))) {
    return { error: say(locale, "Too many checks. Try again in an hour.", "Zu viele Prüfungen. Versuche es in einer Stunde erneut.") };
  }
  const result = await verifyStoredVatId(session.user.id);
  if (!result) return { error: say(locale, "Save a VAT ID first.", "Speichere zuerst eine USt-IdNr.") };
  if (result.status === "VALID") await completePendingContracts(session.user.id, locale).catch(() => undefined);
  revalidateBusiness();
  if (result.status === "VALID") return { success: true, vatStatus: result.status };
  return {
    error:
      result.status === "INVALID"
        ? say(locale, "VIES does not know this VAT ID. Check it for typos.", "VIES kennt diese USt-IdNr. nicht. Prüfe sie auf Tippfehler.")
        : say(locale, "VIES can't be reached right now. Try again later.", "VIES ist gerade nicht erreichbar. Versuche es später erneut."),
    vatStatus: result.status,
  };
}
