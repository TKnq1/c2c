import { prisma } from "@/lib/prisma";
import { sendEmail, type SendEmailResult } from "@/lib/email";
import { verificationEmail, welcomeEmail } from "@/lib/email-templates";
import type { Locale } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/site";
import { hashToken, newToken } from "@/lib/tokens";

// A fresh 24-hour link, mailed: inside the welcome email right after sign-up (pass the new account's role), on its own
// when asked for again (by the person, or by an admin: see verification-resend.ts).
export async function sendVerificationEmail(
  userId: string,
  email: string,
  locale: Locale,
  welcomeAs?: "CREATOR" | "STARTUP",
  foundingNumber?: number | null,
): Promise<SendEmailResult> {
  const token = newToken();
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  const url = `${SITE_URL}/verify-email/${token}`;
  return sendEmail({ to: email, ...(welcomeAs ? welcomeEmail(url, welcomeAs, locale, foundingNumber) : verificationEmail(url, locale)) });
}
