import { redirect } from "next/navigation";
import { FiHeart } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequestCard } from "@/components/request-card";
import { EmptyState } from "@/components/empty-state";
import { formatBudget, formatPostBy } from "@/lib/format";
import { photoUrlsByRequestId, requestPhotoIds } from "@/lib/request-photos";

export default async function CreatorMatchesPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  const interests = await prisma.interest.findMany({
    where: { creator: { userId: session.user.id } },
    include: { request: { include: { startup: true, ...requestPhotoIds }, omit: { imageUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  const photosByRequestId = await photoUrlsByRequestId(interests.map((i) => i.request));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-title-1 font-bold">Your matches</h1>

      {interests.length === 0 ? (
        <EmptyState
          icon={FiHeart}
          title="No matches yet."
          description="Swipe right on a request in your Feed to see it here."
          action={{ label: "Back to Feed", href: "/dashboard/creator" }}
        />
      ) : (
        <div className="divide-y divide-ink/10 overflow-hidden rounded bg-fog">
          {interests.map((i) => (
            <RequestCard
              key={i.id}
              id={i.request.id}
              title={i.request.title}
              minFollowers={i.request.minFollowers}
              budget={formatBudget(i.request.budgetMinCents, i.request.budgetMaxCents)}
              platform={i.request.platform}
              deliverables={i.request.deliverables}
              postBy={i.request.postBy ? formatPostBy(i.request.postBy) : null}
              companyName={i.request.startup.companyName}
              companyAvatarUrl={i.request.startup.avatarUrl}
              brandHref={`/dashboard/creator/discover/${i.request.startup.id}`}
              coverUrl={photosByRequestId.get(i.request.id)?.[0] ?? null}
              interestId={i.id}
              contactedByStartup={i.initiatedBy === "STARTUP"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
