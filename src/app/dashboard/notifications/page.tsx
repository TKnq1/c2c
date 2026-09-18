import Link from "next/link";
import { redirect } from "next/navigation";
import { FiBell } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MarkNotificationsRead } from "@/components/mark-notifications-read";
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
      <h1 className="font-display text-3xl font-normal">Notifications</h1>
      {notifications.length === 0 ? (
        <EmptyState icon={FiBell} title="No notifications yet." />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const content = (
              <div
                className={`rounded-xl border p-3 text-sm transition ${
                  n.read
                    ? "border-ink/10"
                    : "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50"
                } ${n.link ? "hover:border-neutral-400" : ""}`}
              >
                <p className="text-neutral-800 dark:text-neutral-200">{n.message}</p>
                <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
                  {n.createdAt.toLocaleString("en-US")}
                </p>
              </div>
            );
            return n.link ? (
              // Unbounded, per-notification hrefs pointing at all sorts of
              // dynamic destinations — default viewport prefetch would
              // server-render every one of them just from opening this page.
              <Link key={n.id} href={n.link} prefetch={false}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
