import { redirect } from "next/navigation";
import { FiBell } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MarkNotificationsRead } from "@/components/mark-notifications-read";
import { NotificationRow } from "@/components/notification-row";
import { EmptyState } from "@/components/empty-state";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <MarkNotificationsRead />
      <h1 className="font-display text-title-1 font-bold">Notifications</h1>
      {notifications.length === 0 ? (
        <EmptyState icon={FiBell} title="No notifications yet." />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              notification={{ id: n.id, message: n.message, link: n.link, read: n.read, createdAt: n.createdAt.toISOString() }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
