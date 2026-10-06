import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { foundingNoticeEmail } from "@/lib/email-templates";
import { parseLocale } from "@/lib/i18n/locales";
import type { FoundingSide } from "@/lib/founding";

// The brands and creators that were already on comtor when their side's founding places came (the migrations
// numbered them) are told once, by mail. Not the new ones: the wizard and the welcome mail tell those.
//
// Who is mailed: a profile with a founding place that hasn't been told yet (foundingNoticeSentAt is null), whose
// account is neither deleted nor suspended, and whose address is verified. An unverified address may be a typo
// that belongs to someone else, and a bounce costs the sender its reputation. Those see the plan in the app.
const AUDIENCE = {
  foundingNumber: { not: null },
  foundingNoticeSentAt: null,
  user: { deletedAt: null, suspendedAt: null },
} as const;

const VERIFIED = { ...AUDIENCE, user: { ...AUDIENCE.user, emailVerified: true } };
const UNVERIFIED = { ...AUDIENCE, user: { ...AUDIENCE.user, emailVerified: false } };

export async function foundingNoticeAudience() {
  const [brands, creators, unverifiedBrands, unverifiedCreators] = await Promise.all([
    prisma.startupProfile.count({ where: VERIFIED }),
    prisma.creatorProfile.count({ where: VERIFIED }),
    prisma.startupProfile.count({ where: UNVERIFIED }),
    prisma.creatorProfile.count({ where: UNVERIFIED }),
  ]);
  return { verified: brands + creators, unverified: unverifiedBrands + unverifiedCreators, brands, creators };
}

type Recipient = {
  side: FoundingSide;
  id: string;
  foundingNumber: number | null;
  stripeSubscriptionId: string | null;
  user: { email: string; locale: string | null };
};

const RECIPIENT = {
  id: true,
  foundingNumber: true,
  stripeSubscriptionId: true,
  user: { select: { email: true, locale: true } },
} as const;

function markTold(recipient: Recipient, told: boolean) {
  const data = { foundingNoticeSentAt: told ? new Date() : null };
  // Claiming only takes a profile nobody has told yet, so two admins clicking at the same moment can't mail it twice.
  const where = told ? { id: recipient.id, foundingNoticeSentAt: null } : { id: recipient.id };
  return recipient.side === "brand" ? prisma.startupProfile.updateMany({ where, data }) : prisma.creatorProfile.updateMany({ where, data });
}

export async function sendFoundingNotices(): Promise<{ sent: number; failed: number; skipped: number }> {
  const [brands, creators] = await Promise.all([
    prisma.startupProfile.findMany({ where: VERIFIED, select: RECIPIENT, orderBy: { foundingNumber: "asc" } }),
    prisma.creatorProfile.findMany({ where: VERIFIED, select: RECIPIENT, orderBy: { foundingNumber: "asc" } }),
  ]);
  const recipients: Recipient[] = [
    ...brands.map((brand) => ({ ...brand, side: "brand" as const })),
    ...creators.map((creator) => ({ ...creator, side: "creator" as const })),
  ];

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const recipient of recipients) {
    if (!recipient.foundingNumber) continue;
    const claimed = await markTold(recipient, true);
    if (claimed.count === 0) {
      skipped++;
      continue;
    }
    const result = await sendEmail({
      to: recipient.user.email,
      ...foundingNoticeEmail(recipient.foundingNumber, parseLocale(recipient.user.locale), !!recipient.stripeSubscriptionId, recipient.side),
    });
    if (result.ok) {
      sent++;
    } else {
      failed++;
      // Not told after all: stays on the list for the next try.
      await markTold(recipient, false);
    }
  }
  return { sent, failed, skipped };
}
