import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Not authorized", { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, emailVerified: true, totpEnabled: true, createdAt: true },
  });

  const [startupProfile, creatorProfile, notifications, loginHistory, reportsFiled, reportsReceived, blocksMade] =
    await Promise.all([
      prisma.startupProfile.findUnique({
        where: { userId: user.id },
        include: {
          socialLinks: true,
          requests: { include: { interests: { include: { creator: true, messages: true, reviews: true } } } },
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
          interests: { include: { request: { include: { startup: true } }, messages: true, reviews: true } },
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
        select: { reason: true, details: true, status: true, createdAt: true, reported: { select: { email: true } } },
      }),
      prisma.report.findMany({
        where: { reportedId: user.id },
        select: { reason: true, status: true, createdAt: true },
      }),
      prisma.block.findMany({
        where: { blockerId: user.id },
        select: { createdAt: true, blocked: { select: { email: true } } },
      }),
    ]);

  const data = {
    exportedAt: new Date().toISOString(),
    account: user,
    startupProfile,
    creatorProfile,
    notifications,
    loginHistory,
    reportsFiled,
    reportsReceived,
    blocksMade,
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="my-c2c-data.json"',
    },
  });
}
