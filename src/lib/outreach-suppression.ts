import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

// An address that stopped the mails (or was taken off) is remembered only as this hash, so the address
// itself is gone but can't be added or mailed again by mistake.
export function hashOutreachEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export async function suppressedEmailHashes(emails: string[]): Promise<Set<string>> {
  const hashes = emails.map(hashOutreachEmail);
  if (hashes.length === 0) return new Set();
  const rows = await prisma.outreachSuppression.findMany({ where: { emailHash: { in: hashes } }, select: { emailHash: true } });
  return new Set(rows.map((row) => row.emailHash));
}

export async function isOutreachSuppressed(email: string): Promise<boolean> {
  return (await suppressedEmailHashes([email])).size > 0;
}

// Everything an opt-out does, whichever way it arrives (the page, or the one-click link in the mail header):
// the address goes from every list, the record of what was sent to it is deleted, and the hash stays.
export async function completeOutreachOptOut(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  await prisma.$transaction([
    prisma.outreachSuppression.upsert({
      where: { emailHash: hashOutreachEmail(email) },
      create: { emailHash: hashOutreachEmail(email) },
      update: {},
    }),
    prisma.outreachAddress.deleteMany({ where: { email } }),
    prisma.outreachDelivery.deleteMany({ where: { recipientEmail: email } }),
  ]);
}
