import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreatorFeed } from "@/lib/visibility";
import { CreatorFeed } from "@/components/creator-feed";
import { PlatformIcon } from "@/components/platform-icons";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { SkeletonCardList } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { formatFollowers } from "@/lib/format";

export default async function CreatorFeedPage() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  const [creator, savedFilters] = await Promise.all([
    prisma.creatorProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      include: { interests: true, platforms: true },
    }),
    prisma.savedFilter.findMany({
      where: { userId: session.user.id, scope: "creator-feed" },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const requests = await getCreatorFeed(creator, session.user.id);
  const interestIdByRequestId = new Map(creator.interests.map((i) => [i.requestId, i.id]));

  return (
    <div className="flex flex-col gap-6">
      <OnboardingChecklist
        storageKey="onboarding-creator"
        items={[
          { label: "Add your photo", done: !!creator.avatarUrl, href: "/dashboard/creator/settings#profile" },
          { label: "Tell brands about yourself", done: !!creator.bio, href: "/dashboard/creator/settings#profile" },
          {
            label: "Add a link to one of your platforms",
            done: creator.platforms.some((p) => p.url),
            href: "/dashboard/creator/settings#profile",
          },
        ]}
      />

      <div>
        <h1 className="font-display text-3xl font-normal">Your Feed</h1>
        <p className="text-sm text-neutral-600 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 dark:text-neutral-400">
          <span>Matching requests for {creator.niche} ·</span>
          {creator.platforms.map((p) => (
            <span key={p.platform} className="inline-flex items-center gap-1">
              <PlatformIcon platform={p.platform} className="h-3.5 w-3.5" />
              {formatFollowers(p.followerCount)}
            </span>
          ))}
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title="No matching requests yet."
          description="Check back later, or browse every brand on Discover in the meantime."
          action={{ label: "Browse Discover", href: "/dashboard/creator/discover" }}
        />
      ) : (
        <Suspense fallback={<SkeletonCardList />}>
          <CreatorFeed
            requests={requests.map((r) => ({
              id: r.id,
              title: r.title,
              description: r.description,
              niche: r.niche,
              languages: r.languages,
              minFollowers: r.minFollowers,
              productCategory: r.productCategory,
              companyName: r.startup.companyName,
              companyAvatarUrl: r.startup.avatarUrl,
              interestId: interestIdByRequestId.get(r.id) ?? null,
            }))}
            savedFilters={savedFilters}
          />
        </Suspense>
      )}
    </div>
  );
}
