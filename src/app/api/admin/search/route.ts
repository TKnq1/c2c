import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { MINUTE, takeToken } from "@/lib/rate-limit";

export type AdminSearchResult = { id: string; title: string; subtitle: string; href: string };

const LIMIT = 6;

// Backs the ⌘K search of the admin dashboard: accounts by email, company name or display name. Admin only.
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const raw = req.nextUrl.searchParams.get("q")?.trim().slice(0, 64) ?? "";
  if (raw.length < 2) return NextResponse.json([]);
  if (!(await takeToken("admin-search", session.user.id, 120, MINUTE))) return NextResponse.json([], { status: 429 });

  // Prisma's `contains` passes % and _ on as wildcards: they are plain characters here.
  const q = raw.replace(/[\\%_]/g, "\\$&");
  const contains = { contains: q, mode: "insensitive" as const };
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [{ email: contains }, { startupProfile: { is: { companyName: contains } } }, { creatorProfile: { is: { displayName: contains } } }],
    },
    take: LIMIT,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      startupProfile: { select: { companyName: true } },
      creatorProfile: { select: { displayName: true } },
    },
  });

  const results: AdminSearchResult[] = users.map((u) => ({
    id: u.id,
    title: u.startupProfile?.companyName || u.creatorProfile?.displayName || u.email,
    subtitle: `${u.role === "STARTUP" ? "Marke" : u.role === "CREATOR" ? "Creator" : "Admin"} · ${u.email}`,
    href: `/admin/users/${u.id}`,
  }));
  return NextResponse.json(results);
}
