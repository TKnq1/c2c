import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getConversations } from "@/lib/conversations";
import { MessagesList } from "@/components/messages-list";
import { SkeletonCardList } from "@/components/skeleton";

// From lg up Messages is two columns, like a desktop mail or chat app: the
// conversation list stays on the left and the inbox page or an open thread
// fills the right. Below lg the list column isn't rendered at all and each
// page is full width, as before.
export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const conversations = await getConversations(session.user.id, session.user.role);

  return (
    // Full height only where something needs it (an open thread, or the two
    // columns on desktop): a fixed height around the scrolling inbox on a
    // phone would let its last rows run under the tab bar.
    <div className="has-[.chat-thread]:h-full lg:grid lg:h-full lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-6">
      <aside aria-label="Conversations" className="hidden min-h-0 overflow-y-auto lg:block">
        {conversations.length > 0 && (
          <Suspense fallback={<SkeletonCardList />}>
            <MessagesList conversations={conversations} compact />
          </Suspense>
        )}
      </aside>
      <section className="min-h-0 min-w-0 has-[.chat-thread]:h-full lg:h-full">{children}</section>
    </div>
  );
}
