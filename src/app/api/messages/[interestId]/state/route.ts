import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBlocked } from "@/lib/moderation";
import { chatThreadVersion } from "@/lib/chat-version";

// Polled every few seconds by an open chat thread (see ChatLiveUpdates) —
// a few cheap counts instead of the full page render, which re-runs every
// query on the thread page and the dashboard layout above it. The client
// only pays for that full refresh when this version actually changed.
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/messages/[interestId]/state">) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { interestId } = await ctx.params;
  const [interest, readCount] = await Promise.all([
    prisma.interest.findUnique({
      where: { id: interestId },
      select: {
        paymentStatus: true,
        offerRole: true,
        amountCents: true,
        depositStatus: true,
        proofSubmittedAt: true,
        disputedAt: true,
        creator: { select: { userId: true } },
        request: { select: { startup: { select: { userId: true } } } },
        _count: { select: { messages: true, reviews: true } },
      },
    }),
    prisma.message.count({ where: { interestId, read: true } }),
  ]);

  const creatorUserId = interest?.creator.userId;
  const startupUserId = interest?.request.startup.userId;
  if (!interest || !creatorUserId || !startupUserId || ![creatorUserId, startupUserId].includes(session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = chatThreadVersion({
    messageCount: interest._count.messages,
    readCount,
    paymentStatus: interest.paymentStatus,
    offerRole: interest.offerRole,
    amountCents: interest.amountCents,
    depositStatus: interest.depositStatus,
    proofSubmittedAt: interest.proofSubmittedAt,
    disputedAt: interest.disputedAt,
    reviewCount: interest._count.reviews,
    blocked: await isBlocked(creatorUserId, startupUserId),
  });

  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
