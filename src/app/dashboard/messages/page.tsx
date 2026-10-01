import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FiMessageSquare } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { getConversations } from "@/lib/conversations";
import { EmptyState } from "@/components/empty-state";
import { MessagesList } from "@/components/messages-list";
import { SkeletonCardList } from "@/components/skeleton";

export default async function MessagesInboxPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const conversations = await getConversations(session.user.id, session.user.role);

  return (
    <>
      {/* Phones and tablets: the inbox is the page. "Messages" lives in the
          navbar title (see nav.tsx) instead of a page-level heading. */}
      <div className="flex flex-col gap-6 lg:hidden">
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

      {/* Desktop: the list is already on the left (see layout.tsx), so this
          side only waits for a conversation to be picked. */}
      <div className="hidden h-full items-center justify-center rounded bg-fog lg:flex">
        <EmptyState
          icon={FiMessageSquare}
          title={conversations.length === 0 ? "No conversations yet." : "Pick a conversation"}
          description={
            conversations.length === 0
              ? "Conversations start once you match with a creator or brand you're interested in."
              : "Choose one on the left to read and reply."
          }
        />
      </div>
    </>
  );
}
