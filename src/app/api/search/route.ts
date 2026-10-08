import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMutualBlockedUserIds } from "@/lib/moderation";
import { NICHES } from "@/lib/constants";
import { MINUTE, takeToken } from "@/lib/rate-limit";

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
  const raw = req.nextUrl.searchParams.get("q")?.trim().slice(0, 64) ?? "";
  if (raw.length < 2) return NextResponse.json([]);
  // As-you-type search: generous, but not unlimited.
  if (!(await takeToken("search", session.user.id, 120, MINUTE))) return NextResponse.json([], { status: 429 });

  // Prisma's `contains` passes % and _ on as wildcards: they're plain characters here.
  const q = raw.replace(/[\\%_]/g, "\\$&");
  const contains = { contains: q, mode: "insensitive" as const };
  // A creator's niches are a list, which "contains" can't look inside: the
  // niches whose names contain the text are matched instead.
  const matchedNiches = NICHES.filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  const userId = session.user.id;
  const blocked = await getMutualBlockedUserIds(userId);
  const visibleUser = { suspendedAt: null, id: { notIn: blocked } };

  if (session.user.role === "STARTUP") {
    const [creators, chats, requests] = await Promise.all([
      prisma.creatorProfile.findMany({
        where: {
          user: visibleUser,
          OR: [{ displayName: contains }, ...(matchedNiches.length > 0 ? [{ niches: { hasSome: matchedNiches } }] : [])],
        },
        select: { id: true, displayName: true, niches: true, avatarUrl: true },
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
        subtitle: `Creator · ${c.niches.join(", ")}`,
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
        title: r.title || "Untitled draft",
        subtitle: `Request · ${r.status === "OPEN" ? "Open" : r.status === "DRAFT" ? "Draft" : "Closed"} · ${r.niche}`,
        href: r.status === "DRAFT" ? `/dashboard/startup/requests/${r.id}/edit` : `/dashboard/startup/requests/${r.id}`,
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
