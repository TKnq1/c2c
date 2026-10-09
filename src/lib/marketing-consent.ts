import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { marketingConsentEmail } from "@/lib/email-templates";
import { parseLocale } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/site";
import { hashToken, newToken } from "@/lib/tokens";

// A fresh link sooner than this is the same mail again. Stops a settings
// button from posting the same confirmation over and over.
export const MARKETING_RESEND_AFTER_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type MarketingConsentResult = "sent" | "already" | "soon" | "stopped" | "failed";

export function marketingResendBlocked(sentAt: Date | null, now = Date.now()) {
  return sentAt !== null && now - sentAt.getTime() < MARKETING_RESEND_AFTER_MS;
}

// The settings button. Does not record consent: that is the button on the
// page the link opens.
export async function requestMarketingConsent(userId: string): Promise<MarketingConsentResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, locale: true, deletedAt: true, marketingConsentAt: true, marketingSentAt: true },
  });
  if (!user || user.deletedAt) return "failed";
  if (user.marketingConsentAt) return "already";
  if (marketingResendBlocked(user.marketingSentAt)) return "soon";

  const token = newToken();
  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      marketingTokenHash: hashToken(token),
      marketingTokenExpiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
      marketingSentAt: now,
    },
  });

  try {
    await sendEmail({ to: user.email, ...marketingConsentEmail(`${SITE_URL}/marketing/confirm/${token}`, parseLocale(user.locale)) });
  } catch (err) {
    console.error("Marketing confirmation email failed:", err);
    return "failed";
  }
  return "sent";
}

// The account form's checkbox is the consent itself, so nothing is mailed to confirm it: the address was just given by the person
// who is signing up, and ticking the box is the explicit, unprompted "yes". The moment is stored, as it is for the confirmed link.
export function marketingConsentFromCheckbox(checked: boolean): { marketingConsentAt?: Date } {
  return checked ? { marketingConsentAt: new Date() } : {};
}

export async function confirmMarketingConsent(token: string): Promise<"ok" | "invalid"> {
  const user = await prisma.user.findUnique({
    where: { marketingTokenHash: hashToken(token) },
    select: { id: true, deletedAt: true, marketingConsentAt: true, marketingTokenExpiresAt: true },
  });
  if (!user || user.deletedAt || !user.marketingTokenExpiresAt || user.marketingTokenExpiresAt <= new Date()) {
    return "invalid";
  }
  if (!user.marketingConsentAt) {
    await prisma.user.update({ where: { id: user.id }, data: { marketingConsentAt: new Date() } });
  }
  return "ok";
}

export async function withdrawMarketingConsent(userId: string): Promise<MarketingConsentResult> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      marketingConsentAt: null,
      marketingTokenHash: null,
      marketingTokenExpiresAt: null,
      marketingSentAt: null,
    },
  });
  return "stopped";
}
