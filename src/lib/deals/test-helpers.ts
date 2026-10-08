// Scenario seeding shared by the integration tests (they run against a real Postgres, see lifecycle.integration.test.ts).
// Not part of the app: nothing imports this outside the tests.
import type { PrismaClient } from "@prisma/client";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

let counter = 0;

export type SeedOptions = {
  brand?: string;
  category?: string;
  exclusivity?: { days: number };
  budget?: number;
  creatorId?: string;
  creatorUserId?: string;
  // No campaign briefing row: the request runs on the defaults.
  noBriefing?: boolean;
};

// A brand with a request and a briefing, a creator, both with complete business details, and an open offer from the brand.
// `created` collects the ids of the users made here, so the test can remove them again.
export async function seedOffer(prisma: PrismaClient, created: string[], options: SeedOptions = {}) {
  counter += 1;
  const tag = `${Date.now()}${counter}`;
  const brandUser = await prisma.user.create({
    data: {
      email: `brand-${tag}@test.local`,
      passwordHash: "x",
      role: "STARTUP",
      emailVerified: true,
      startupProfile: { create: { companyName: options.brand ?? "Glow GmbH" } },
    },
    include: { startupProfile: true },
  });
  const creatorUser = options.creatorUserId
    ? await prisma.user.findUniqueOrThrow({ where: { id: options.creatorUserId }, include: { creatorProfile: true } })
    : await prisma.user.create({
        data: {
          email: `creator-${tag}@test.local`,
          passwordHash: "x",
          role: "CREATOR",
          emailVerified: true,
          creatorProfile: { create: { displayName: "Mia Summers", niches: ["Beauty"], niche: "Beauty", stripeAccountId: "acct_test", stripeOnboarded: true } },
        },
        include: { creatorProfile: true },
      });
  created.push(brandUser.id);
  if (!options.creatorUserId) created.push(creatorUser.id);

  const now = new Date();
  for (const [user, name, role] of [[brandUser, options.brand ?? "Glow GmbH", "STARTUP"], [creatorUser, "Mia Summers", "CREATOR"]] as const) {
    await prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        legalName: name,
        businessType: role === "STARTUP" ? "COMPANY" : "FREELANCER",
        country: "DE",
        addressLine1: "Teststraße 1",
        postalCode: "10115",
        city: "Berlin",
        taxNumber: "12/345/67890",
        traderSelfCertifiedAt: now,
        traderCertVersion: "2026-10",
        ...(role === "CREATOR" ? { selfBillingAcceptedAt: now, selfBillingVersion: "2026-10" } : {}),
      },
    });
  }

  const startup = brandUser.startupProfile!;
  const creator = creatorUser.creatorProfile!;
  const request = await prisma.request.create({
    data: {
      startupId: startup.id,
      title: "Autumn launch",
      description: "Show our new cream",
      niche: "Beauty",
      productCategory: options.category ?? "Cosmetics",
      platform: "TikTok",
      deliverables: "1 TikTok video",
      budgetMinCents: options.budget ?? 100_000,
      budgetMaxCents: options.budget ?? 100_000,
      postBy: new Date(Date.now() + 20 * DAY),
    },
  });
  if (!options.noBriefing) await prisma.campaignBriefing.create({
    data: {
      requestId: request.id,
      targetMarket: "DE",
      contentFormats: ["TIKTOK_VIDEO"],
      disclosureLabels: ["Werbung", "Anzeige"],
      requirePaidPartnershipLabel: true,
      draftRequired: true,
      minLiveHours: 24,
      postingWindowEnd: new Date(Date.now() + 20 * DAY),
      exclusivityEnabled: Boolean(options.exclusivity),
      exclusivityDaysAfter: options.exclusivity?.days ?? 0,
    },
  });
  const amount = options.budget ?? 100_000;
  const interest = await prisma.interest.create({
    data: {
      requestId: request.id,
      creatorId: creator.id,
      amountCents: amount,
      platformFeeCents: Math.round(amount * 0.1),
      payoutCents: amount - Math.round(amount * 0.1),
      paymentStatus: "OFFERED",
      offerRole: "STARTUP",
      offeredAt: now,
    },
  });
  await prisma.offerEvent.create({ data: { interestId: interest.id, role: "STARTUP", amountCents: amount, outcome: "PENDING" } });
  return { brand: { id: brandUser.id, role: "STARTUP" as const }, creator: { id: creatorUser.id, role: "CREATOR" as const }, interest, request, amount };
}
