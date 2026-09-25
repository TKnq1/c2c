import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasBlocked, isBlocked } from "@/lib/moderation";
import { Avatar } from "@/components/avatar";
import { MarkThreadRead } from "@/components/mark-thread-read";
import { ReportBlockActions } from "@/components/report-block-actions";
import { ChatConversation } from "@/components/chat-conversation";
import { ChatLiveUpdates } from "@/components/chat-live-updates";
import { ChatViewport } from "@/components/chat-viewport";
import { buildCollabTimeline } from "@/lib/collab-timeline";
import { chatThreadVersion } from "@/lib/chat-version";
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

  // Either side's block stops messaging; only this viewer's own block is
  // one they can lift, so the menu and the notice below need both.
  const [blockedEitherWay, blockedByMe] = await Promise.all([
    isBlocked(session.user.id, other.userId),
    hasBlocked(session.user.id, other.userId),
  ]);
  const blockedNotice = blockedByMe
    ? `You blocked ${other.name}. Unblock them from the ⋯ menu to message again.`
    : blockedEitherWay
      ? `You can't message ${other.name} anymore.`
      : null;

  const latestUnreadId =
    interest.messages.findLast((m) => m.senderRole !== session.user.role && !m.read)?.id ?? null;

  const feeRatePercent = (interest.request.startup.isPro ? PRO_PLATFORM_FEE_RATE : PLATFORM_FEE_RATE) * 100;
  // The current offer, shown as a card in the conversation at the time it
  // was made (see ChatOfferCard) rather than pinned above it.
  const offer =
    interest.paymentStatus !== null && interest.amountCents !== null
      ? {
          at: (interest.offeredAt ?? interest.createdAt).getTime(),
          status: interest.paymentStatus,
          offerRole: interest.offerRole,
          amountCents: interest.amountCents,
          payoutCents: interest.payoutCents,
          viewerRole: session.user.role,
          otherPartyName: other.name,
          paymentsHref: isStartup ? "/dashboard/startup/payments" : "/dashboard/creator/payments",
          feeRatePercent,
          proofUrl: interest.proofUrl,
          proofSubmittedAt: interest.proofSubmittedAt?.getTime() ?? null,
          disputed: interest.disputedAt !== null,
          payoutsReady: interest.creator.stripeOnboarded,
        }
      : null;
  // Only brands open the negotiation, and only while nothing's on the table
  // — the same rule sendOfferAction enforces server-side.
  const makeOffer = isStartup && interest.paymentStatus === null && !blockedEitherWay ? { feeRatePercent } : null;

  const version = chatThreadVersion({
    messageCount: interest.messages.length,
    readCount: interest.messages.filter((m) => m.read).length,
    paymentStatus: interest.paymentStatus,
    offerRole: interest.offerRole,
    amountCents: interest.amountCents,
    depositStatus: interest.depositStatus,
    proofSubmittedAt: interest.proofSubmittedAt,
    disputedAt: interest.disputedAt,
    reviewCount: interest.reviews.length,
    blocked: blockedEitherWay,
  });

  return (
    // chat-thread: on phones, main drops its padding for this page (see
    // globals.css) so the thread can run edge to edge — its own header and
    // composer take over the safe-area insets instead, since the nav bars
    // that normally handle them are hidden here.
    <div className="chat-thread flex h-full flex-col">
      <MarkThreadRead interestId={interestId} latestUnreadId={latestUnreadId} />
      <ChatLiveUpdates interestId={interestId} version={version} />
      <ChatViewport />

      <header className="flex shrink-0 items-center gap-2 border-b border-ink/10 px-2 pb-2 pt-[calc(var(--safe-top)+8px)] md:px-0 md:pb-3 md:pt-0">
        <Link
          href="/dashboard/messages"
          transitionTypes={["nav-back"]}
          aria-label="Back to messages"
          className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-fog md:ml-0"
        >
          <IoChevronBack className="h-6 w-6" />
        </Link>
        <Link href={other.href} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={other.avatarUrl} name={other.name} size={40} />
          <span className="min-w-0 truncate font-semibold">{other.name}</span>
        </Link>
        <ReportBlockActions otherUserId={other.userId} otherName={other.name} initialBlockedByMe={blockedByMe} />
      </header>

      {/* One combined, chronological feed — chat bubbles for messages, the
          current offer as a card, small centered rows for payment/deposit/
          review milestones — so the whole collab's story reads in one place
          instead of being split across this thread, the Payments page, and
          the request detail page. The timeline's own "proposed" row is left
          out since the offer card already stands in for it. Dates cross into
          the client as plain numbers; formatting happens there, in the
          viewer's own time zone. */}
      <ChatConversation
        interestId={interestId}
        requestTitle={interest.request.title}
        blockedNotice={blockedNotice}
        offer={offer}
        makeOffer={makeOffer}
        messages={interest.messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.getTime(),
          isMine: m.senderRole === session.user.role,
          read: m.read,
        }))}
        events={buildCollabTimeline(interest)
          .filter((e) => e.type !== "offer")
          .map((e) => ({ at: e.at.getTime(), label: e.label, href: e.href }))}
      />
    </div>
  );
}
