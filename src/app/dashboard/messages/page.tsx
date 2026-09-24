import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/empty-state";
import { MessagesList } from "@/components/messages-list";
import { SkeletonCardList } from "@/components/skeleton";
import { FiMessageSquare } from "react-icons/fi";

export default async function MessagesInboxPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isStartup = session.user.role === "STARTUP";
  const role = session.user.role;

  const conversations = isStartup
    ? (
        await prisma.interest.findMany({
          where: { request: { startup: { userId: session.user.id } } },
          include: { creator: true, request: true, messages: { orderBy: { createdAt: "desc" } } },
          orderBy: { createdAt: "desc" },
        })
      ).map((i) => ({
        interestId: i.id,
        requestTitle: i.request.title,
        other: { name: i.creator.displayName, avatarUrl: i.creator.avatarUrl },
        lastMessage: i.messages[0]
          ? { body: i.messages[0].body, createdAt: i.messages[0].createdAt.getTime(), isMine: i.messages[0].senderRole === role }
          : null,
        messageSearchText: i.messages.map((m) => m.body).join(" "),
        unreadCount: i.messages.filter((m) => m.senderRole !== role && !m.read).length,
        lastActivityAt: i.messages[0]?.createdAt ?? i.createdAt,
      }))
    : (
        await prisma.interest.findMany({
          where: { creator: { userId: session.user.id } },
          include: { request: { include: { startup: true } }, messages: { orderBy: { createdAt: "desc" } } },
          orderBy: { createdAt: "desc" },
        })
      ).map((i) => ({
        interestId: i.id,
        requestTitle: i.request.title,
        other: { name: i.request.startup.companyName, avatarUrl: i.request.startup.avatarUrl },
        lastMessage: i.messages[0]
          ? { body: i.messages[0].body, createdAt: i.messages[0].createdAt.getTime(), isMine: i.messages[0].senderRole === role }
          : null,
        messageSearchText: i.messages.map((m) => m.body).join(" "),
        unreadCount: i.messages.filter((m) => m.senderRole !== role && !m.read).length,
        lastActivityAt: i.messages[0]?.createdAt ?? i.createdAt,
      }));

  conversations.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());

  return (
    <div className="flex flex-col gap-6">
      {/* "Messages" now lives in the navbar title (see nav.tsx) instead of
          repeating it here as a page-level heading. */}
      {conversations.length === 0 ? (
        <EmptyState
          icon={FiMessageSquare}
          title="No conversations yet."
          description="Conversations start once you match with a creator or brand you're interested in."
        />
      ) : (
        <Suspense fallback={<SkeletonCardList />}>
          <MessagesList conversations={conversations} />
        </Suspense>
      )}
    </div>
  );
}
