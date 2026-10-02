import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiInbox } from "react-icons/fi";
import { IoChatbubblesOutline, IoCheckmarkCircleOutline, IoPeopleOutline, IoWalletOutline } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/avatar";
import { RequestsFilterBar } from "@/components/requests-filter-bar";
import { BulkRequestsList } from "@/components/bulk-requests-list";
import { EmptyState } from "@/components/empty-state";
import { formatBudget } from "@/lib/format";
import { photoUrlsByRequestId, requestPhotoIds } from "@/lib/request-photos";
import { getUnreadMessageCount } from "@/lib/messages";
import { OverviewTiles } from "@/components/overview-tiles";
import { windowStart } from "@/lib/admin-stats";

export default async function StartupDashboardPage(props: PageProps<"/dashboard/startup">) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  const searchParams = await props.searchParams;
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const sort = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;

  // Filtered through the startup relation rather than startup.id, so this
  // doesn't have to wait on the query below to know what to ask for — one
  // round-trip instead of two.
  const mine = { request: { startup: { userId: session.user.id } } };
  const weekAgo = windowStart(7);
  const [startup, allRequests, interested, interestedThisWeek, unreadMessages, toApprove, offersToAnswer, toPay] = await Promise.all([
    prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.request.findMany({
      where: { startup: { userId: session.user.id } },
      include: { _count: { select: { interests: true } }, ...requestPhotoIds },
      omit: { imageUrl: true },
      orderBy: { createdAt: "desc" },
    }),
    // Same groups as the Payments page's sections the tiles link to.
    prisma.interest.count({ where: { ...mine, initiatedBy: "CREATOR", paymentStatus: null } }),
    prisma.interest.count({ where: { ...mine, initiatedBy: "CREATOR", paymentStatus: null, createdAt: { gte: weekAgo } } }),
    getUnreadMessageCount(session.user.id, "STARTUP"),
    prisma.interest.count({ where: { ...mine, paymentStatus: "HELD", proofSubmittedAt: { not: null }, disputedAt: null } }),
    prisma.interest.count({ where: { ...mine, paymentStatus: "OFFERED", offerRole: "CREATOR" } }),
    prisma.interest.count({ where: { ...mine, paymentStatus: "ACCEPTED" } }),
  ]);
  const openPayments = offersToAnswer + toPay;

  const hasAnyRequests = allRequests.length > 0;
  const photosByRequestId = await photoUrlsByRequestId(allRequests);
  const requests = allRequests
    .filter((r) => (status === "OPEN" || status === "CLOSED" ? r.status === status : true))
    .sort((a, b) => {
      if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
      if (sort === "interest") return b._count.interests - a._count.interests;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  return (
    <div className="page-wide flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={startup.avatarUrl} name={startup.companyName} size={48} />
          <h1 className="truncate font-display text-title-1 font-bold">{startup.companyName}</h1>
        </div>
        {/* From md up the sidebar has its own New request button. */}
        <Link
          href="/dashboard/startup/new"
          className="rounded-full bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition whitespace-nowrap md:hidden"
        >
          + New request
        </Link>
      </div>

      <OverviewTiles
        tiles={[
          {
            label: "Interested creators",
            value: interested,
            hint: interestedThisWeek > 0 ? `${interestedThisWeek} new this week` : "Waiting for an offer",
            href: "/dashboard/startup/payments#interested",
            icon: IoPeopleOutline,
          },
          {
            label: "Unread messages",
            value: unreadMessages,
            hint: unreadMessages > 0 ? "Reply to keep things moving" : "You're all caught up",
            href: "/dashboard/messages",
            icon: IoChatbubblesOutline,
          },
          {
            label: "Posts to approve",
            value: toApprove,
            hint: toApprove > 0 ? "Released automatically if you wait" : "Nothing to review",
            href: "/dashboard/startup/payments#to-approve",
            icon: IoCheckmarkCircleOutline,
          },
          {
            label: "Open payments",
            value: openPayments,
            hint: toPay > 0 ? `${toPay} accepted, waiting to be paid` : offersToAnswer > 0 ? "Counter-offers to answer" : "Nothing outstanding",
            href: toPay > 0 ? "/dashboard/startup/payments#to-pay" : "/dashboard/startup/payments#offers",
            icon: IoWalletOutline,
          },
        ]}
      />

      {hasAnyRequests && (
        <Suspense fallback={<div className="h-10" />}>
          <RequestsFilterBar />
        </Suspense>
      )}

      {requests.length === 0 ? (
        hasAnyRequests ? (
          <EmptyState icon={FiInbox} title="No requests match this filter." description="Try switching to a different tab above." />
        ) : (
          <EmptyState
            icon={FiInbox}
            title="No requests yet."
            description="Post a request so matching creators can find and apply to it."
            action={{ label: "Create your first request", href: "/dashboard/startup/new" }}
          />
        )
      ) : (
        <BulkRequestsList
          requests={requests.map((r) => ({
            id: r.id,
            title: r.title,
            niche: r.niche,
            minFollowers: r.minFollowers,
            budget: formatBudget(r.budgetMinCents, r.budgetMaxCents),
            budgetMinCents: r.budgetMinCents,
            createdAt: r.createdAt.getTime(),
            status: r.status,
            interestCount: r._count.interests,
            coverUrl: photosByRequestId.get(r.id)?.[0] ?? null,
          }))}
        />
      )}
    </div>
  );
}
