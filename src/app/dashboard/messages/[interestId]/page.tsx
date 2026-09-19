import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBlocked } from "@/lib/moderation";
import { Avatar } from "@/components/avatar";
import { MessageForm } from "@/components/message-form";
import { MarkThreadRead } from "@/components/mark-thread-read";
import { ScrollToBottom } from "@/components/scroll-to-bottom";
import { ReportBlockActions } from "@/components/report-block-actions";
import { ChatOfferPanel } from "@/components/chat-offer-panel";
import { buildCollabTimeline } from "@/lib/collab-timeline";
import { PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE } from "@/lib/constants";

export default async function MessageThreadPage({ params }: { params: Promise<{ interestId: string }> }) {
  const { interestId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: {
      request: { include: { startup: true } },
      creator: true,
      messages: { orderBy: { createdAt: "asc" } },
      reviews: true,
    },
  });
  if (!interest) notFound();

  const isStartup = session.user.role === "STARTUP";
  const isParticipant = isStartup
    ? interest.request.startup.userId === session.user.id
    : interest.creator.userId === session.user.id;
  if (!isParticipant) notFound();

  const other = isStartup
    ? {
        name: interest.creator.displayName,
        avatarUrl: interest.creator.avatarUrl,
        href: `/dashboard/startup/discover/${interest.creator.id}`,
        userId: interest.creator.userId,
      }
    : {
        name: interest.request.startup.companyName,
        avatarUrl: interest.request.startup.avatarUrl,
        href: `/dashboard/creator/discover/${interest.request.startup.id}`,
        userId: interest.request.startup.userId,
      };
  const otherBlocked = await isBlocked(session.user.id, other.userId);

  // One combined, chronological feed — chat bubbles for messages, small
  // centered rows for offer/payment/deposit/review milestones — so the
  // whole collab's story reads in one place instead of being split across
  // this thread, the Payments page, and the request detail page.
  const timelineEvents = buildCollabTimeline(interest);
  const feed = [
    ...interest.messages.map((m, i) => ({
      at: m.createdAt,
      kind: "message" as const,
      message: m,
      isLastMine:
        m.senderRole === session.user.role &&
        !interest.messages.slice(i + 1).some((later) => later.senderRole === session.user.role),
    })),
    ...timelineEvents.map((e) => ({ at: e.at, kind: "event" as const, event: e })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <div className="flex flex-col h-[75dvh]">
      <MarkThreadRead interestId={interestId} />
      <div className="shrink-0">
        <Link href="/dashboard/messages" className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
          ← Messages
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div className="flex items-center gap-3">
            <Avatar src={other.avatarUrl} name={other.name} size={40} />
            <div>
              <Link href={other.href} className="font-semibold hover:underline">
                {other.name}
              </Link>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{interest.request.title}</p>
            </div>
          </div>
          <ReportBlockActions otherUserId={other.userId} initialBlocked={otherBlocked} />
        </div>
        <ChatOfferPanel
          interestId={interestId}
          viewerRole={session.user.role}
          paymentStatus={interest.paymentStatus}
          offerRole={interest.offerRole}
          amountCents={interest.amountCents}
          payoutCents={interest.payoutCents}
          otherPartyName={other.name}
          paymentsHref={isStartup ? "/dashboard/startup/payments" : "/dashboard/creator/payments"}
          feeRatePercent={(interest.request.startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE) * 100}
        />
      </div>

      <ScrollToBottom
        watch={feed.length}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 py-4"
      >
        {interest.messages.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No messages yet. Say hi — this is the start of your conversation about &quot;{interest.request.title}&quot;.
          </p>
        )}
        {feed.map((item, i) => {
          if (item.kind === "event") {
            const content = (
              <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
                {item.event.label} · {item.event.at.toLocaleString("en-US")}
              </p>
            );
            return (
              <div key={`event-${i}`} className="py-1">
                {item.event.href ? (
                  <a
                    href={item.event.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:underline"
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </div>
            );
          }

          const m = item.message;
          const isMine = m.senderRole === session.user.role;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMine
                    ? "bg-ink text-paper"
                    : "bg-fog text-neutral-900 dark:text-neutral-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                <p className={`text-[11px] mt-1 ${isMine ? "text-neutral-300 dark:text-neutral-500" : "text-neutral-500 dark:text-neutral-400"}`}>
                  {m.createdAt.toLocaleString("en-US")}
                  {item.isLastMine && m.read && " · Seen"}
                </p>
              </div>
            </div>
          );
        })}
      </ScrollToBottom>

      <div className="shrink-0">
        {otherBlocked ? (
          <p className="text-sm text-neutral-500 text-center py-2 dark:text-neutral-400">
            You&apos;ve blocked {other.name}. Unblock them to send messages again.
          </p>
        ) : (
          <MessageForm interestId={interestId} />
        )}
      </div>
    </div>
  );
}
