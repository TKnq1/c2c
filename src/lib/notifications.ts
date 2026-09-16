import type { NotificationCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export type { NotificationCategory };

const PREFERENCE_FIELDS = {
  newRequests: "notifyNewRequests",
  newInterest: "notifyNewInterest",
  newCreators: "notifyNewCreators",
  messages: "notifyMessages",
  payments: "notifyPayments",
  deposits: "notifyDeposits",
} as const;

// Categories prone to bursts (many similar, lower-urgency events close
// together — e.g. five matching creators joining within an hour) collapse
// into one running-count notification instead of flooding the list.
// Categories where each event carries distinct, important content (a
// specific message, a specific payment amount) are deliberately left
// alone — folding those together would hide information someone actually
// needs to see individually.
const DIGESTS: Partial<Record<NotificationCategory, { plural: (count: number) => string; link: string }>> = {
  newRequests: { plural: (n) => `${n} new requests match your profile`, link: "/dashboard/creator" },
  newCreators: {
    plural: (n) => `${n} new creators joined matching your requests`,
    link: "/dashboard/startup/discover",
  },
  newInterest: { plural: (n) => `${n} creators are interested in your requests`, link: "/dashboard/startup" },
};

export async function notify(userId: string, message: string, link: string | undefined, category: NotificationCategory) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifyNewRequests: true,
      notifyNewInterest: true,
      notifyNewCreators: true,
      notifyMessages: true,
      notifyPayments: true,
      notifyDeposits: true,
    },
  });
  if (!user || !user[PREFERENCE_FIELDS[category]]) return;

  const digest = DIGESTS[category];
  const existing = digest
    ? await prisma.notification.findFirst({
        where: { userId, category, read: false },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (digest && existing) {
    const count = existing.count + 1;
    const digestedMessage = digest.plural(count);
    // Bumping createdAt keeps it at the top of the list — it's still the
    // most recent thing that happened, just now representing several events.
    await prisma.notification.update({
      where: { id: existing.id },
      data: { message: digestedMessage, link: digest.link, count, createdAt: new Date() },
    });
    await sendPushToUser(userId, { title: "C2C", body: digestedMessage, url: digest.link });
    return;
  }

  await prisma.notification.create({ data: { userId, message, link, category } });
  await sendPushToUser(userId, { title: "C2C", body: message, url: link });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
