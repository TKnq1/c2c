import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

// Brands with an open request this creator could take, told once. Signup
// used to send this in one shot; the platform step does it for someone who
// already has an account, and creating the account from a guest draft does
// it here. A brand-new account has no blocks yet.
export async function notifyBrandsAboutCreator(
  creator: { id: string; displayName: string; niches: string[] },
  maxFollowers: number,
) {
  if (creator.niches.length === 0) return;
  const matchingRequests = await prisma.request.findMany({
    where: { niche: { in: creator.niches }, minFollowers: { lte: maxFollowers }, status: "OPEN" },
    include: { startup: true },
  });
  const notifiedStartupIds = new Set<string>();
  for (const request of matchingRequests) {
    if (notifiedStartupIds.has(request.startupId)) continue;
    notifiedStartupIds.add(request.startupId);
    await notify(
      request.startup.userId,
      `New ${request.niche} creator joined: ${creator.displayName}`,
      `/dashboard/startup/discover/${creator.id}`,
      "newCreators",
    );
  }
}
