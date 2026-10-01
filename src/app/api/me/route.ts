import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Me = { name: string; avatarUrl: string | null };

// Who's signed in, for the profile button at the bottom of the desktop
// sidebar (see Nav). Fetched once when Nav mounts, not per navigation like
// /api/nav-counts, since a name and photo rarely change mid-session.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      startupProfile: { select: { companyName: true, avatarUrl: true } },
      creatorProfile: { select: { displayName: true, avatarUrl: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const me: Me = {
    name: user.startupProfile?.companyName ?? user.creatorProfile?.displayName ?? user.email,
    avatarUrl: user.startupProfile?.avatarUrl ?? user.creatorProfile?.avatarUrl ?? null,
  };
  return NextResponse.json(me);
}
