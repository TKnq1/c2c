import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMutualBlockedUserIds } from "@/lib/moderation";

export type SearchResult = {
  kind: "person" | "chat" | "request";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  avatarUrl: string | null;
};

const LIMIT = 5;

// Backs the ⌘K search (see CommandPalette): the other side's profiles
// (creators for a brand, brands for a creator), the viewer's own chats, and
// requests — a brand's own, or the ones a creator is matched with. Blocked
// and suspended accounts are left out, as everywhere else.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user.role !== "STARTUP" && session.user.role !== "CREATOR")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const contains = { contains: q, mode: "insensitive" as const };
  const userId = session.user.id;
  const blocked = await getMutualBlockedUserIds(userId);
  const visibleUser = { suspendedAt: null, id: { notIn: blocked } };

  if (session.user.role === "STARTUP") {
    const [creators, chats, requests] = await Promise.all([
      prisma.creatorProfile.findMany({
        where: { user: visibleUser, OR: [{ displayName: contains }, { niche: contains }] },
        select: { id: true, displayName: true, niche: true, avatarUrl: true },
        take: LIMIT,
      }),
      prisma.interest.findMany({
        where: {
          request: { startup: { userId } },
          creator: { user: visibleUser },
          OR: [{ creator: { displayName: contains } }, { request: { title: contains } }],
        },
        select: { id: true, creator: { select: { displayName: true, avatarUrl: true } }, request: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
      }),
      prisma.request.findMany({
        where: { startup: { userId }, title: contains },
        select: { id: true, title: true, status: true, niche: true },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
      }),
    ]);
    const results: SearchResult[] = [
      ...creators.map((c) => ({
        kind: "person" as const,
        id: c.id,
        title: c.displayName,
        subtitle: `Creator · ${c.niche}`,
        href: `/dashboard/startup/discover/${c.id}`,
        avatarUrl: c.avatarUrl,
      })),
      ...chats.map((i) => ({
        kind: "chat" as const,
        id: i.id,
        title: i.creator.displayName,
        subtitle: `Chat · ${i.request.title}`,
        href: `/dashboard/messages/${i.id}`,
        avatarUrl: i.creator.avatarUrl,
      })),
      ...requests.map((r) => ({
        kind: "request" as const,
        id: r.id,
        title: r.title,
        subtitle: `Request · ${r.status === "OPEN" ? "Open" : "Closed"} · ${r.niche}`,
        href: `/dashboard/startup/requests/${r.id}`,
        avatarUrl: null,
      })),
    ];
    return NextResponse.json(results);
  }

  const [brands, chats] = await Promise.all([
    prisma.startupProfile.findMany({
      where: { user: visibleUser, OR: [{ companyName: contains }, { niche: contains }] },
      select: { id: true, companyName: true, niche: true, avatarUrl: true },
      take: LIMIT,
    }),
    prisma.interest.findMany({
      where: {
        creator: { userId },
        request: { startup: { user: visibleUser } },
        OR: [{ request: { title: contains } }, { request: { startup: { companyName: contains } } }],
      },
      select: {
        id: true,
        request: { select: { title: true, startup: { select: { companyName: true, avatarUrl: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
  ]);
  const results: SearchResult[] = [
    ...brands.map((b) => ({
      kind: "person" as const,
      id: b.id,
      title: b.companyName,
      subtitle: b.niche ? `Brand · ${b.niche}` : "Brand",
      href: `/dashboard/creator/discover/${b.id}`,
      avatarUrl: b.avatarUrl,
    })),
    // A creator's chats are their matched requests, so these cover both.
    ...chats.map((i) => ({
      kind: "chat" as const,
      id: i.id,
      title: i.request.title,
      subtitle: `Chat · ${i.request.startup.companyName}`,
      href: `/dashboard/messages/${i.id}`,
      avatarUrl: i.request.startup.avatarUrl,
    })),
  ];
  return NextResponse.json(results);
}
