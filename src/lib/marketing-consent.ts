import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { marketingConsentEmail } from "@/lib/email-templates";
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

// The checkbox, or the settings button. Does not record consent: that is
// the button on the page the link opens.
export async function requestMarketingConsent(userId: string): Promise<MarketingConsentResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, deletedAt: true, marketingConsentAt: true, marketingSentAt: true },
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
    await sendEmail({ to: user.email, ...marketingConsentEmail(`${SITE_URL}/marketing/confirm/${token}`) });
  } catch (err) {
    console.error("Marketing confirmation email failed:", err);
    return "failed";
  }
  return "sent";
}

export function queueMarketingConsent(userId: string) {
  after(() => requestMarketingConsent(userId).catch((err) => console.error("Marketing confirmation email failed:", err)));
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
