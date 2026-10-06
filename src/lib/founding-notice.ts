import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { foundingNoticeEmail } from "@/lib/email-templates";
import { parseLocale } from "@/lib/i18n/locales";

// The brands that were already on comtor when the founding places came (the migration numbered them) are told
// once, by mail. Not the new ones: the wizard and the welcome mail tell those.
//
// Who is mailed: a founding brand that hasn't been told yet (foundingNoticeSentAt is null), whose account is
// neither deleted nor suspended, and whose address is verified. An unverified address may be a typo that
// belongs to someone else, and a bounce costs the sender its reputation. Those brands see the plan in the app.
const AUDIENCE = {
  foundingNumber: { not: null },
  foundingNoticeSentAt: null,
  user: { deletedAt: null, suspendedAt: null },
} as const;

export async function foundingNoticeAudience() {
  const [verified, unverified] = await Promise.all([
    prisma.startupProfile.count({ where: { ...AUDIENCE, user: { ...AUDIENCE.user, emailVerified: true } } }),
    prisma.startupProfile.count({ where: { ...AUDIENCE, user: { ...AUDIENCE.user, emailVerified: false } } }),
  ]);
  return { verified, unverified };
}

export async function sendFoundingNotices(): Promise<{ sent: number; failed: number; skipped: number }> {
  const brands = await prisma.startupProfile.findMany({
    where: { ...AUDIENCE, user: { ...AUDIENCE.user, emailVerified: true } },
    select: {
      id: true,
      foundingNumber: true,
      stripeSubscriptionId: true,
      user: { select: { email: true, locale: true } },
    },
    orderBy: { foundingNumber: "asc" },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const brand of brands) {
    if (!brand.foundingNumber) continue;
    // Claimed before the mail goes out, so two admins clicking at the same moment can't mail a brand twice.
    const claimed = await prisma.startupProfile.updateMany({
      where: { id: brand.id, foundingNoticeSentAt: null },
      data: { foundingNoticeSentAt: new Date() },
    });
    if (claimed.count === 0) {
      skipped++;
      continue;
    }
    const result = await sendEmail({
      to: brand.user.email,
      ...foundingNoticeEmail(brand.foundingNumber, parseLocale(brand.user.locale), !!brand.stripeSubscriptionId),
    });
    if (result.ok) {
      sent++;
    } else {
      failed++;
      // Not told after all: stays on the list for the next try.
      await prisma.startupProfile.update({ where: { id: brand.id }, data: { foundingNoticeSentAt: null } });
    }
  }
  return { sent, failed, skipped };
}
