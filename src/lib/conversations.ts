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
export const getConversations = cache(async (userId: string, role: Role): Promise<ConversationSummary[]> => {
  const rows =
    role === "STARTUP"
      ? (
          await prisma.interest.findMany({
            where: { request: { startup: { userId } } },
            include: { creator: true, request: true, messages: { orderBy: { createdAt: "desc" } } },
            orderBy: { createdAt: "desc" },
          })
        ).map((i) => ({
          interest: i,
          other: { name: i.creator.displayName, avatarUrl: i.creator.avatarUrl },
        }))
      : (
          await prisma.interest.findMany({
            where: { creator: { userId } },
            include: { request: { include: { startup: true } }, messages: { orderBy: { createdAt: "desc" } } },
            orderBy: { createdAt: "desc" },
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
        unreadCount: i.messages.filter((m) => m.senderRole !== role && !m.read).length,
      },
    }))
    .sort((a, b) => b.at - a.at)
    .map(({ conversation }) => conversation);
});
