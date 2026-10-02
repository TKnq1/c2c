import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// A profile exists from the moment signup creates it, but with placeholder
// empty values for whatever the onboarding wizard hasn't collected yet
// (see signupAction) — "" (or an empty niche list) rather than null so the
// required DB columns don't need a migration just to support this staged
// fill-in.
export async function isOnboardingComplete(userId: string, role: Role): Promise<boolean> {
  if (role === "STARTUP") {
    const profile = await prisma.startupProfile.findUnique({
      where: { userId },
      select: { companyName: true, niche: true },
    });
    return !!profile?.companyName && !!profile?.niche;
  }
  if (role === "CREATOR") {
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId },
      select: { displayName: true, niches: true },
    });
    return !!profile?.displayName && !!profile.niches.length;
  }
  return true; // ADMIN has no profile to complete
}
