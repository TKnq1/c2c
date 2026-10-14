import type { VatIdStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkVatId } from "@/lib/tax/vies";
import { parseVatId } from "@/lib/tax/vat-id";

// Asks VIES about the VAT ID on a business profile and stores the answer with its consultation number. A VAT ID that
// was confirmed once is not downgraded because VIES is down today: UNAVAILABLE only replaces a status that was not VALID.
export async function verifyStoredVatId(userId: string): Promise<{ status: VatIdStatus } | null> {
  const profile = await prisma.businessProfile.findUnique({ where: { userId } });
  if (!profile?.vatId) return null;

  const parsed = parseVatId(profile.vatId);
  const now = new Date();
  if (!parsed.ok) {
    await prisma.businessProfile.update({ where: { userId }, data: { vatIdStatus: "INVALID", vatIdCheckedAt: now } });
    return { status: "INVALID" };
  }

  const result = await checkVatId(parsed.vatId);
  if (result.status === "UNAVAILABLE") {
    if (profile.vatIdStatus !== "VALID") await prisma.businessProfile.update({ where: { userId }, data: { vatIdStatus: "UNAVAILABLE", vatIdCheckedAt: now } });
    return { status: profile.vatIdStatus === "VALID" ? "VALID" : "UNAVAILABLE" };
  }
  await prisma.businessProfile.update({
    where: { userId },
    data:
      result.status === "VALID"
        ? {
            vatIdStatus: "VALID",
            vatIdCheckedAt: now,
            vatIdConsultationNumber: result.consultationNumber,
            vatIdRegisteredName: result.name,
            vatIdRegisteredAddress: result.address,
          }
        : { vatIdStatus: "INVALID", vatIdCheckedAt: now, vatIdConsultationNumber: null, vatIdRegisteredName: null, vatIdRegisteredAddress: null },
  });
  return { status: result.status };
}
