import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getConversations } from "@/lib/conversations";
import { MessagesList } from "@/components/messages-list";
import { SkeletonCardList } from "@/components/skeleton";
import { PageTitle } from "@/components/page-title";
import { getT } from "@/lib/i18n/server";

// From lg up Messages is two columns, like a desktop mail or chat app: the
// conversation list stays on the left and the inbox page or an open thread
// fills the right. Below lg the list column isn't rendered at all and each
// page is full width, as before.
export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  const session = await auth();
  if (!session) redirect("/login");

  const conversations = await getConversations(session.user.id, session.user.role);

  return (
    // Full height only where something needs it (an open thread, or the two
    // columns on desktop): a fixed height around the scrolling inbox on a
    // phone would let its last rows run under the tab bar.
    <div className="page-wide group flex flex-col gap-6 has-[.chat-thread]:h-full lg:h-full">
      {/* Above the inbox from md, and above both columns on desktop; a
          thread on a tablet has its own header instead. */}
      <PageTitle className="md:group-has-[.chat-thread]:max-lg:sr-only">{t("nav.messages")}</PageTitle>
      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-6">
        <aside aria-label={t("nav.messages")} className="hidden min-h-0 overflow-y-auto lg:block">
          {conversations.length > 0 && (
            <Suspense fallback={<SkeletonCardList />}>
              <MessagesList conversations={conversations} compact />
            </Suspense>
          )}
        </aside>
        <section className="min-h-0 min-w-0 has-[.chat-thread]:h-full lg:h-full">{children}</section>
      </div>
    </div>
  );
}
