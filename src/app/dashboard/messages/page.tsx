import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FiMessageSquare } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { getConversations } from "@/lib/conversations";
import { EmptyState } from "@/components/empty-state";
import { MessagesList } from "@/components/messages-list";
import { SkeletonCardList } from "@/components/skeleton";
import { getT } from "@/lib/i18n/server";

export default async function MessagesInboxPage() {
  const t = await getT();
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
            title={t("screens.messages.noneYet")}
            description={t("screens.messages.noneYetBody")}
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
          title={conversations.length === 0 ? t("screens.messages.noneYet") : t("screens.messages.pick")}
          description={
            conversations.length === 0 ? t("screens.messages.noneYetBody") : t("screens.messages.pickBody")
          }
        />
      </div>
    </>
  );
}
