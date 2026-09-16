import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.interest.deleteMany();
  await prisma.request.deleteMany();
  await prisma.creatorProfile.deleteMany();
  await prisma.startupProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // No profile needed — an admin doesn't participate in the marketplace,
  // just views the platform-wide overview.
  await prisma.user.create({
    data: { email: "admin@example.com", passwordHash, role: "ADMIN" },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  // Offset each request by N minutes from the start of the current month so
  // creation order is deterministic no matter which day the seed is run on.
  const at = (minutesOffset: number) => new Date(monthStart.getTime() + minutesOffset * 60_000);

  // Simple generated letter-avatar (no binary asset needed) so seeded brands
  // have something to show in the UI before anyone uploads a real logo.
  function initialsAvatar(text: string, bg: string) {
    const initial = text.charAt(0).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="64" fill="${bg}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="system-ui,sans-serif" font-size="56" fill="white">${initial}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }

  const startup1User = await prisma.user.create({
    data: {
      email: "startup1@example.com",
      passwordHash,
      role: "STARTUP",
      emailVerified: true,
      startupProfile: {
        create: {
          companyName: "Glow Beauty Co",
          avatarUrl: initialsAvatar("Glow Beauty Co", "#ec4899"),
          website: "https://glowbeauty.co",
          niche: "Beauty",
          description: "Clean, cruelty-free skincare made for everyday glow.",
          lookingFor: "Authentic before/after content and honest first-impression reviews.",
          socialLinks: {
            create: [
              { platform: "Instagram", url: "https://instagram.com/glowbeautyco" },
              { platform: "TikTok", url: "https://tiktok.com/@glowbeautyco" },
            ],
          },
        },
      },
    },
    include: { startupProfile: true },
  });
  const startup1 = startup1User.startupProfile!;

  const startup2User = await prisma.user.create({
    data: {
      email: "startup2@example.com",
      passwordHash,
      role: "STARTUP",
      startupProfile: {
        create: {
          companyName: "FitTech Labs",
          avatarUrl: initialsAvatar("FitTech Labs", "#f97316"),
          website: "https://fittechlabs.com",
          niche: "Fitness",
          description: "Wearable training tech for people who take their workouts seriously.",
          lookingFor: "Real workout footage, no green-screen ads. Bonus for run/lift split content.",
          // On Pro — demonstrates the reduced platform fee alongside
          // FitTech's already-released payment below.
          isPro: true,
          proSince: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          socialLinks: {
            create: [
              { platform: "Instagram", url: "https://instagram.com/fittechlabs" },
              { platform: "YouTube", url: "https://youtube.com/@fittechlabs" },
            ],
          },
        },
      },
    },
    include: { startupProfile: true },
  });
  const startup2 = startup2User.startupProfile!;

  const startup3User = await prisma.user.create({
    data: {
      email: "startup3@example.com",
      passwordHash,
      role: "STARTUP",
      startupProfile: {
        create: {
          companyName: "TasteBox",
          avatarUrl: initialsAvatar("TasteBox", "#22c55e"),
          website: "https://tastebox.com",
          niche: "Food",
          description: "A monthly snack box curating small-batch treats from around the world.",
          lookingFor: "Unboxing and taste-test videos with genuine reactions.",
          socialLinks: {
            create: [
              { platform: "Instagram", url: "https://instagram.com/tastebox" },
              { platform: "TikTok", url: "https://tiktok.com/@tastebox" },
            ],
          },
        },
      },
    },
    include: { startupProfile: true },
  });
  const startup3 = startup3User.startupProfile!;

  const startup4User = await prisma.user.create({
    data: {
      email: "startup4@example.com",
      passwordHash,
      role: "STARTUP",
      startupProfile: {
        create: {
          companyName: "StyleHub",
          website: "https://stylehub.com",
          niche: "Fashion",
          description: "Affordable, trend-forward fashion drops released every two weeks.",
          lookingFor: "Lookbook-style styling content and try-on hauls.",
          socialLinks: {
            create: [
              { platform: "Instagram", url: "https://instagram.com/stylehub" },
              { platform: "X", url: "https://x.com/stylehub" },
            ],
          },
        },
      },
    },
    include: { startupProfile: true },
  });
  const startup4 = startup4User.startupProfile!;

  // Glow Beauty Co: 5 requests at varying thresholds — demonstrates
  // follower-gating (creator2's 3k followers only clears the first two).
  const glowThresholds = [1000, 3000, 5000, 10000, 20000];
  for (let i = 0; i < glowThresholds.length; i++) {
    await prisma.request.create({
      data: {
        startupId: startup1.id,
        title: `Beauty Collab #${i + 1}`,
        description:
          "We're looking for creators to authentically showcase our new skincare line.",
        niche: "Beauty",
        minFollowers: glowThresholds[i],
        productCategory: "Cosmetics",
        createdAt: at(i),
      },
    });
  }

  // FitTech Labs: 6 requests.
  for (let i = 0; i < 6; i++) {
    await prisma.request.create({
      data: {
        startupId: startup2.id,
        title: `Fitness Challenge #${i + 1}`,
        description: "Feature our new training series in your workout content.",
        niche: "Fitness",
        minFollowers: 5000 + i * 2000,
        productCategory: "Sportswear",
        createdAt: at(i),
      },
    });
  }

  // TasteBox: 5 requests.
  for (let i = 0; i < 5; i++) {
    await prisma.request.create({
      data: {
        startupId: startup3.id,
        title: `Food Box Unboxing #${i + 1}`,
        description: "Show off our seasonal snack box in an unboxing video.",
        niche: "Food",
        minFollowers: 10000 + i * 10000,
        productCategory: "Food & Beverage",
        createdAt: at(i),
      },
    });
  }

  // StyleHub: 3 requests, targeting the German-speaking market — demonstrates
  // the language filter alongside the default-English requests everywhere else.
  for (let i = 0; i < 3; i++) {
    await prisma.request.create({
      data: {
        startupId: startup4.id,
        title: `Fashion Drop #${i + 1}`,
        description: "Style our new collection in a lookbook post.",
        niche: "Fashion",
        language: "German",
        minFollowers: 3000 + i * 3000,
        productCategory: "Fashion",
        createdAt: at(i),
      },
    });
  }

  const creator1User = await prisma.user.create({
    data: {
      email: "creator1@example.com",
      passwordHash,
      role: "CREATOR",
      emailVerified: true,
      creatorProfile: {
        create: {
          displayName: "Mia Summers",
          avatarUrl: initialsAvatar("Mia Summers", "#f43f5e"),
          niche: "Beauty",
          contentLanguage: "English",
          bio: "Skincare-obsessed creator sharing honest routines and first-impression reviews.",
          // Multiple platforms on purpose: demonstrates that matching uses
          // the highest reach across platforms (Instagram here), while the
          // TikTok count alone would not clear as many thresholds.
          platforms: {
            create: [
              { platform: "Instagram", followerCount: 50000, url: "https://instagram.com/miasummers" },
              { platform: "TikTok", followerCount: 12000, url: "https://tiktok.com/@miasummers" },
            ],
          },
        },
      },
    },
    include: { creatorProfile: true },
  });

  const creator2User = await prisma.user.create({
    data: {
      email: "creator2@example.com",
      passwordHash,
      role: "CREATOR",
      creatorProfile: {
        create: {
          displayName: "Lena Cross",
          niche: "Beauty",
          platforms: { create: [{ platform: "TikTok", followerCount: 3000 }] },
        },
      },
    },
    include: { creatorProfile: true },
  });

  const creator3User = await prisma.user.create({
    data: {
      email: "creator3@example.com",
      passwordHash,
      role: "CREATOR",
      creatorProfile: {
        create: {
          displayName: "Jonas Fit",
          avatarUrl: initialsAvatar("Jonas Fit", "#3b82f6"),
          niche: "Fitness",
          contentLanguage: "English",
          bio: "Strength training and running content — real footage, no green screens.",
          platforms: {
            create: [
              { platform: "YouTube", followerCount: 20000, url: "https://youtube.com/@jonasfit" },
            ],
          },
        },
      },
    },
    include: { creatorProfile: true },
  });

  const creator4User = await prisma.user.create({
    data: {
      email: "creator4@example.com",
      passwordHash,
      role: "CREATOR",
      creatorProfile: {
        create: {
          displayName: "Paul Delish",
          avatarUrl: initialsAvatar("Paul Delish", "#eab308"),
          niche: "Food",
          platforms: { create: [{ platform: "Instagram", followerCount: 100000 }] },
        },
      },
    },
    include: { creatorProfile: true },
  });

  const creator5User = await prisma.user.create({
    data: {
      email: "creator5@example.com",
      passwordHash,
      role: "CREATOR",
      creatorProfile: {
        create: {
          displayName: "Sara Trend",
          niche: "Fashion",
          contentLanguage: "German",
          bio: "Fashion-Content auf Deutsch — Lookbooks, Try-on-Hauls und Styling-Tipps.",
          platforms: { create: [{ platform: "TikTok", followerCount: 10000 }] },
        },
      },
    },
    include: { creatorProfile: true },
  });

  // Pre-seed five Interests across different payment states so the escrow
  // feature is visible without manual clicking on first load.
  const fitTechFirstRequest = await prisma.request.findFirstOrThrow({
    where: { startupId: startup2.id },
    orderBy: { createdAt: "asc" },
  });
  const glowFirstRequest = await prisma.request.findFirstOrThrow({
    where: { startupId: startup1.id },
    orderBy: { createdAt: "asc" },
  });
  const glowSecondRequest = await prisma.request.findFirstOrThrow({
    where: { startupId: startup1.id },
    orderBy: { createdAt: "asc" },
    skip: 1,
  });
  const styleHubFirstRequest = await prisma.request.findFirstOrThrow({
    where: { startupId: startup4.id },
    orderBy: { createdAt: "asc" },
  });
  const tasteBoxFirstRequest = await prisma.request.findFirstOrThrow({
    where: { startupId: startup3.id },
    orderBy: { createdAt: "asc" },
  });

  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  // 1) Jonas Fit x FitTech Labs — full lifecycle: paid, released, and
  // reviewed by both sides, so the reviews feature has data without any
  // manual clicking on first load.
  const jonasFitInterest = await prisma.interest.create({
    data: {
      requestId: fitTechFirstRequest.id,
      creatorId: creator3User.creatorProfile!.id,
      amountCents: 50_000, // $500.00
      platformFeeCents: 1_500, // $15.00 — FitTech is on Pro (3%), not the standard 10%
      payoutCents: 48_500, // $485.00
      paymentStatus: "RELEASED",
      paidAt: threeDaysAgo,
      releasedAt: oneDayAgo,
      proofUrl: "https://youtube.com/watch?v=example-leg-day",
    },
  });

  const oneHour = 60 * 60 * 1000;

  await prisma.message.createMany({
    data: [
      {
        interestId: jonasFitInterest.id,
        senderRole: "STARTUP",
        body: "Hey Jonas! Loved your last run video — would you be up for a lift-day piece featuring our new tracker?",
        read: true,
        createdAt: threeDaysAgo,
      },
      {
        interestId: jonasFitInterest.id,
        senderRole: "CREATOR",
        body: "Definitely, I've got a leg day session planned for this week — I'll build it around the tracker.",
        read: true,
        createdAt: threeDaysAgo,
      },
      {
        interestId: jonasFitInterest.id,
        senderRole: "STARTUP",
        body: "Perfect, sending payment now so it's ready once you post.",
        read: true,
        createdAt: oneDayAgo,
      },
      // Fast back-and-forth right after posting — gives both sides a
      // realistic (and quick) response-time reading, not just the one
      // 2-day gap above.
      {
        interestId: jonasFitInterest.id,
        senderRole: "CREATOR",
        body: "Just posted it — check the tracker feature at 0:45!",
        read: true,
        createdAt: new Date(oneDayAgo.getTime() + oneHour),
      },
      {
        interestId: jonasFitInterest.id,
        senderRole: "STARTUP",
        body: "This looks awesome, thank you!",
        read: true,
        createdAt: new Date(oneDayAgo.getTime() + oneHour + 15 * 60 * 1000),
      },
      {
        interestId: jonasFitInterest.id,
        senderRole: "CREATOR",
        body: "Glad you like it! Let me know if you want more angles.",
        read: true,
        createdAt: new Date(oneDayAgo.getTime() + 2 * oneHour),
      },
      {
        interestId: jonasFitInterest.id,
        senderRole: "STARTUP",
        body: "We're all set, thanks again!",
        read: true,
        createdAt: new Date(oneDayAgo.getTime() + 2 * oneHour + 20 * 60 * 1000),
      },
    ],
  });

  await prisma.review.createMany({
    data: [
      {
        interestId: jonasFitInterest.id,
        creatorId: creator3User.creatorProfile!.id,
        startupId: startup2.id,
        authorRole: "STARTUP",
        rating: 5,
        comment: "Jonas delivered exactly what we asked for, ahead of schedule. Would work with him again.",
      },
      {
        interestId: jonasFitInterest.id,
        creatorId: creator3User.creatorProfile!.id,
        startupId: startup2.id,
        authorRole: "CREATOR",
        rating: 5,
        comment: "Clear brief, fast payment. Great brand to collaborate with.",
      },
    ],
  });

  // 2) Sara Trend x StyleHub — held, awaiting the creator to release it.
  const saraStyleHubInterest = await prisma.interest.create({
    data: {
      requestId: styleHubFirstRequest.id,
      creatorId: creator5User.creatorProfile!.id,
      amountCents: 30_000, // $300.00
      platformFeeCents: 3_000, // $30.00 (10%)
      payoutCents: 27_000, // $270.00
      paymentStatus: "HELD",
      paidAt: oneDayAgo,
      // StyleHub is also shipping Sara the physical piece she's featuring —
      // demonstrates the deposit flow awaiting the creator's payment.
      depositCents: 3_000, // $30.00
      depositStatus: "REQUESTED",
      depositRequestedAt: oneDayAgo,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        interestId: saraStyleHubInterest.id,
        senderRole: "STARTUP",
        body: "Hi Sara! We'd love to have you feature our new drop.",
        read: true,
        createdAt: oneDayAgo,
      },
      {
        interestId: saraStyleHubInterest.id,
        senderRole: "CREATOR",
        body: "So excited! Let's do it 🙌",
        read: true,
        createdAt: new Date(oneDayAgo.getTime() + 20 * 60 * 1000),
      },
      {
        interestId: saraStyleHubInterest.id,
        senderRole: "CREATOR",
        body: "Quick q — do you have sizing guidelines you want me to mention?",
        read: true,
        createdAt: new Date(oneDayAgo.getTime() + 2 * oneHour),
      },
      {
        interestId: saraStyleHubInterest.id,
        senderRole: "STARTUP",
        body: "Yes, I'll send the size chart over now.",
        read: true,
        createdAt: new Date(oneDayAgo.getTime() + 6 * oneHour),
      },
    ],
  });

  // 3) Mia Summers x Glow Beauty Co — interested, not yet paid. Has one
  // unread message waiting from the brand, so the inbox unread badge and
  // notification bell both have something to show on first login.
  const glowMiaInterest = await prisma.interest.create({
    data: {
      requestId: glowFirstRequest.id,
      creatorId: creator1User.creatorProfile!.id,
      // Mia already paid her deposit for the sample serum set — demonstrates
      // the brand's release/forfeit decision on first load.
      depositCents: 2_000, // $20.00
      depositStatus: "HELD",
      depositRequestedAt: oneDayAgo,
      depositPaidAt: oneDayAgo,
    },
  });

  await prisma.message.create({
    data: {
      interestId: glowMiaInterest.id,
      senderRole: "STARTUP",
      body: "Hi Mia! Loved your morning routine reel — would love to chat about our new serum launch.",
    },
  });

  // 4) Paul Delish x TasteBox — paid, then cancelled and refunded because
  // the creator never delivered. Demonstrates the refund path, and (via the
  // slow reply below) why: a 40-hour response time is a big part of why
  // this collab fell through.
  const paulTasteBoxInterest = await prisma.interest.create({
    data: {
      requestId: tasteBoxFirstRequest.id,
      creatorId: creator4User.creatorProfile!.id,
      amountCents: 40_000, // $400.00
      platformFeeCents: 4_000, // $40.00 (10%)
      payoutCents: 36_000, // $360.00
      paymentStatus: "REFUNDED",
      paidAt: threeDaysAgo,
      refundedAt: oneDayAgo,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        interestId: paulTasteBoxInterest.id,
        senderRole: "STARTUP",
        body: "Hi Paul, excited to get this box collab going — can you post by Friday?",
        read: true,
        createdAt: threeDaysAgo,
      },
      {
        interestId: paulTasteBoxInterest.id,
        senderRole: "CREATOR",
        body: "Sorry for the late reply — yes I can still make Friday work.",
        read: true,
        createdAt: new Date(threeDaysAgo.getTime() + 40 * oneHour),
      },
    ],
  });

  // 5) Lena Cross x Glow Beauty Co — an offer sent but not yet answered,
  // demonstrating the accept/decline step before any money actually moves.
  const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const lenaGlowInterest = await prisma.interest.create({
    data: {
      requestId: glowSecondRequest.id,
      creatorId: creator2User.creatorProfile!.id,
      amountCents: 15_000, // $150.00
      platformFeeCents: 1_500, // $15.00 (10%)
      payoutCents: 13_500, // $135.00
      paymentStatus: "OFFERED",
      offerRole: "STARTUP",
      offeredAt: fiveHoursAgo,
    },
  });

  await prisma.message.create({
    data: {
      interestId: lenaGlowInterest.id,
      senderRole: "STARTUP",
      body: "Hi Lena! We'd love to send you our new serum set — sent an offer for the collab, let us know what you think.",
      read: true,
      createdAt: fiveHoursAgo,
    },
  });

  // Glow Beauty Co has Jonas Fit saved for later, and it's mutual — Jonas
  // has Glow Beauty saved too — so neither Favorites page is empty on
  // first look, and the pair demonstrates both directions at once.
  await prisma.favorite.create({
    data: { startupId: startup1.id, creatorId: creator3User.creatorProfile!.id, favoritedByRole: "STARTUP" },
  });
  await prisma.favorite.create({
    data: { startupId: startup1.id, creatorId: creator3User.creatorProfile!.id, favoritedByRole: "CREATOR" },
  });

  console.log("Seed complete. All accounts use password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
