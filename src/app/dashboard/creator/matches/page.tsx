import { redirect } from "next/navigation";
import type { PaymentStatus } from "@prisma/client";
import { FiHeart } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/empty-state";
import { MatchesList, type MatchEntry, type MatchGroup } from "@/components/matches-list";
import { formatBudget, formatCents, formatPostBy } from "@/lib/format";
import { photoUrlsByRequestId, requestPhotoIds } from "@/lib/request-photos";

// Where a match stands, from the creator's side: still waiting on the brand
// to answer (open), talking or negotiating (in chat), money held or paid out
// (paid), or refunded (only under All).
function stageOf(paymentStatus: PaymentStatus | null, brandReplied: boolean): {
  group: MatchGroup;
  label: string;
  emphasis: boolean;
} {
  switch (paymentStatus) {
    case null:
      return brandReplied
        ? { group: "chat", label: "In chat", emphasis: false }
        : { group: "open", label: "Waiting for reply", emphasis: false };
    case "OFFERED":
      return { group: "chat", label: "Offer pending", emphasis: true };
    case "ACCEPTED":
      return { group: "chat", label: "Awaiting payment", emphasis: false };
    case "HELD":
      return { group: "paid", label: "In escrow", emphasis: true };
    case "RELEASED":
      return { group: "paid", label: "Paid out", emphasis: false };
    case "REFUNDED":
      return { group: "closed", label: "Refunded", emphasis: false };
  }
}

export default async function CreatorMatchesPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  const interests = await prisma.interest.findMany({
    where: { creator: { userId: session.user.id } },
    include: {
      request: { include: { startup: true, ...requestPhotoIds }, omit: { imageUrl: true } },
      _count: { select: { messages: { where: { senderRole: "STARTUP" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const photosByRequestId = await photoUrlsByRequestId(interests.map((i) => i.request));

  const matches: MatchEntry[] = interests.map((i) => {
    const stage = stageOf(i.paymentStatus, i._count.messages > 0 || i.initiatedBy === "STARTUP");
    const budget = formatBudget(i.request.budgetMinCents, i.request.budgetMaxCents);
    return {
      group: stage.group,
      stage: { label: stage.label, emphasis: stage.emphasis },
      amount: i.amountCents !== null ? formatCents(i.amountCents) : budget,
      amountCents: i.amountCents ?? i.request.budgetMinCents,
      matchedAt: i.createdAt.getTime(),
      canWithdraw: i.paymentStatus === null,
      id: i.request.id,
      title: i.request.title,
      minFollowers: i.request.minFollowers,
      budget,
      platform: i.request.platform,
      deliverables: i.request.deliverables,
      postBy: i.request.postBy ? formatPostBy(i.request.postBy) : null,
      companyName: i.request.startup.companyName,
      companyAvatarUrl: i.request.startup.avatarUrl,
      brandHref: `/dashboard/creator/discover/${i.request.startup.id}`,
      coverUrl: photosByRequestId.get(i.request.id)?.[0] ?? null,
      interestId: i.id,
      contactedByStartup: i.initiatedBy === "STARTUP",
    };
  });

  return (
    <div className="page-wide flex flex-col gap-6">
      <h1 className="font-display text-title-1 font-bold">Your matches</h1>

      {interests.length === 0 ? (
        <EmptyState
          icon={FiHeart}
          title="No matches yet."
          description="Swipe right on a request in your Feed to see it here."
          action={{ label: "Back to Feed", href: "/dashboard/creator" }}
        />
      ) : (
        <MatchesList matches={matches} />
      )}
    </div>
  );
}
