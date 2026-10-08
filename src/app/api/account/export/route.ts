import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { participantOf } from "@/lib/account-deletion";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Not authorized", { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      totpEnabled: true,
      createdAt: true,
      marketingConsentAt: true,
      marketingSentAt: true,
    },
  });

  const [startupProfile, creatorProfile, notifications, loginHistory, reportsFiled, reportsReceived, blocksMade, businessProfile, deals, invoices] =
    await Promise.all([
      prisma.startupProfile.findUnique({
        where: { userId: user.id },
        include: {
          socialLinks: true,
          requests: {
            include: {
              images: { orderBy: { position: "asc" } },
              // The other side by name only: their profile row holds payment ids and account data that
              // are theirs, not part of this person's data.
              interests: {
                include: { creator: { select: { id: true, displayName: true } }, messages: true, reviews: true },
              },
            },
          },
          reviews: true,
          favorites: {
            where: { favoritedByRole: "STARTUP" },
            include: { creator: { select: { displayName: true } } },
          },
        },
      }),
      prisma.creatorProfile.findUnique({
        where: { userId: user.id },
        include: {
          platforms: true,
          reviews: true,
          interests: {
            include: {
              request: { include: { startup: { select: { id: true, companyName: true } } } },
              messages: true,
              reviews: true,
            },
          },
          favoritedBy: {
            where: { favoritedByRole: "CREATOR" },
            include: { startup: { select: { companyName: true } } },
          },
        },
      }),
      prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      prisma.loginAttempt.findMany({
        where: { userId: user.id, succeeded: true },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, ipAddress: true, userAgent: true },
      }),
      prisma.report.findMany({
        where: { reporterId: user.id },
        select: { reason: true, details: true, status: true, createdAt: true },
      }),
      prisma.report.findMany({
        where: { reportedId: user.id },
        select: { reason: true, status: true, createdAt: true },
      }),
      prisma.block.findMany({
        where: { blockerId: user.id },
        select: { createdAt: true },
      }),
      prisma.businessProfile.findUnique({ where: { userId: user.id } }),
      // The brand deals this person is a party to. The tax snapshot holds the other side's details and is left out;
      // proof images are listed by id and checksum, not inlined.
      prisma.deal.findMany({
        where: { interest: participantOf(user.id) },
        omit: { taxSnapshot: true },
        include: {
          drafts: true,
          posts: { include: { proofs: { select: { id: true, kind: true, contentType: true, sha256: true, createdAt: true } }, metrics: true } },
          events: { orderBy: { createdAt: "asc" } },
          disputes: true,
        },
      }),
      prisma.invoice.findMany({ where: { recipientUserId: user.id }, orderBy: { issuedAt: "asc" } }),
    ]);

  const data = {
    exportedAt: new Date().toISOString(),
    account: user,
    // Request photos are stored as bytes — exported as data URIs, the way
    // the single image before them was.
    startupProfile: startupProfile && {
      ...startupProfile,
      requests: startupProfile.requests.map(({ images, ...request }) => ({
        ...request,
        photos: images.map((i) => `data:${i.contentType};base64,${Buffer.from(i.data).toString("base64")}`),
      })),
    },
    creatorProfile,
    businessProfile,
    deals,
    invoices,
    notifications,
    loginHistory,
    reportsFiled,
    reportsReceived,
    blocksMade,
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="my-comtor-data.json"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
