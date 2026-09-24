import { redirect } from "next/navigation";
import { FiHeart } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequestCard } from "@/components/request-card";
import { EmptyState } from "@/components/empty-state";

export default async function CreatorMatchesPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  const interests = await prisma.interest.findMany({
    where: { creator: { userId: session.user.id } },
    include: { request: { include: { startup: true } } },
    orderBy: { createdAt: "desc" },
  });

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
        <div className="flex flex-col gap-4">
          {interests.map((i) => (
            <RequestCard
              key={i.id}
              id={i.request.id}
              title={i.request.title}
              description={i.request.description}
              niche={i.request.niche}
              languages={i.request.languages}
              minFollowers={i.request.minFollowers}
              productCategory={i.request.productCategory}
              companyName={i.request.startup.companyName}
              companyAvatarUrl={i.request.startup.avatarUrl}
              interestId={i.id}
              contactedByStartup={i.initiatedBy === "STARTUP"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
