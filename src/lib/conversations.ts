import { cache } from "react";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ConversationSummary = {
  interestId: string;
  requestTitle: string;
  other: { name: string; avatarUrl: string | null };
  lastMessage: { body: string; createdAt: number; isMine: boolean } | null;
  messageSearchText: string;
  unreadCount: number;
};

// Every conversation of the signed-in user, most recent activity first.
// cache() because the Messages layout (the list next to an open chat on
// desktop) and the inbox page both need it in the same request.
// What one inbox loads at most: the newest conversations, and from each its newest messages (enough for
// the preview and the search). Unread counts are counted in the database, not from what was loaded.
const MAX_CONVERSATIONS = 300;
const MESSAGES_PER_CONVERSATION = 100;

export const getConversations = cache(async (userId: string, role: Role): Promise<ConversationSummary[]> => {
  const messageArgs = { orderBy: { createdAt: "desc" as const }, take: MESSAGES_PER_CONVERSATION };
  const unreadArgs = { select: { messages: { where: { senderRole: { not: role }, read: false } } } };
  const rows =
    role === "STARTUP"
      ? (
          await prisma.interest.findMany({
            where: { request: { startup: { userId } } },
            include: { creator: true, request: true, messages: messageArgs, _count: unreadArgs },
            orderBy: { createdAt: "desc" },
            take: MAX_CONVERSATIONS,
          })
        ).map((i) => ({
          interest: i,
          other: { name: i.creator.displayName, avatarUrl: i.creator.avatarUrl },
        }))
      : (
          await prisma.interest.findMany({
            where: { creator: { userId } },
            include: { request: { include: { startup: true } }, messages: messageArgs, _count: unreadArgs },
            orderBy: { createdAt: "desc" },
            take: MAX_CONVERSATIONS,
          })
        ).map((i) => ({
          interest: i,
          other: { name: i.request.startup.companyName, avatarUrl: i.request.startup.avatarUrl },
        }));

  return rows
    .map(({ interest: i, other }) => ({
      at: (i.messages[0]?.createdAt ?? i.createdAt).getTime(),
      conversation: {
        interestId: i.id,
        requestTitle: i.request.title,
        other,
        lastMessage: i.messages[0]
          ? { body: i.messages[0].body, createdAt: i.messages[0].createdAt.getTime(), isMine: i.messages[0].senderRole === role }
          : null,
        messageSearchText: i.messages.map((m) => m.body).join(" "),
        unreadCount: i._count.messages,
      },
    }))
    .sort((a, b) => b.at - a.at)
    .map(({ conversation }) => conversation);
});
