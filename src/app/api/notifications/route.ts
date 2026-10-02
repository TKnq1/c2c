import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type NotificationItem = { id: string; message: string; link: string | null; read: boolean; createdAt: string };

// The latest notifications for the sidebar's notifications panel (see
// NotificationsPanelButton); the full list stays on /dashboard/notifications.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const items: NotificationItem[] = notifications.map((n) => ({
    id: n.id,
    message: n.message,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
  return NextResponse.json(items);
}
