import { notFound, redirect } from "next/navigation";
import { FiClock } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeResponseTimeMs, formatResponseTime } from "@/lib/response-time";
import { getCreatorFeed } from "@/lib/visibility";
import { formatFollowers } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { RatingSummary } from "@/components/stars";
import { ReviewsList } from "@/components/reviews-list";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteStartupAction, unfavoriteStartupAction } from "@/lib/actions/favorites";
import { StartConversationAsCreator } from "@/components/start-conversation-as-creator";

export default async function BrandProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  // None of these five depend on each other — they only need `id` (the
  // route param) or `session.user.id` (both already available), not each
  // other's query results, so they run as one round-trip instead of five
  // sequential ones. (`startupId: id` below is the same value `startup.id`
  // would be once fetched — no need to wait for that fetch just to restate
  // the id we already have.)
  const [startup, creator, reviews, conversations, completedCollabs] = await Promise.all([
    prisma.startupProfile.findUnique({
      where: { id },
      include: { socialLinks: true },
    }),
    prisma.creatorProfile.findUniqueOrThrow({
      where: { userId: session.user.id },
      include: { platforms: true },
    }),
    prisma.review.findMany({
      where: { startupId: id, authorRole: "CREATOR" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interest.findMany({
      where: { request: { startupId: id } },
      select: { messages: { orderBy: { createdAt: "asc" }, select: { senderRole: true, createdAt: true } } },
    }),
    prisma.interest.count({
      where: { paymentStatus: "RELEASED", request: { startupId: id } },
    }),
  ]);
  if (!startup) notFound();

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const responseTimeLabel = formatResponseTime(
    computeResponseTimeMs(
      conversations.map((c) => c.messages),
      "STARTUP",
    ),
  );

  const [existingInterest, feed, favorite] = await Promise.all([
    prisma.interest.findFirst({
      where: { creatorId: creator.id, request: { startupId: startup.id } },
      select: { id: true },
    }),
    getCreatorFeed(creator, session.user.id),
    prisma.favorite.findUnique({
      where: {
        startupId_creatorId_favoritedByRole: { startupId: startup.id, creatorId: creator.id, favoritedByRole: "CREATOR" },
      },
    }),
  ]);
  const matchingRequests = feed.filter((r) => r.startupId === startup.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={startup.avatarUrl} name={startup.companyName} size={64} />
          <div>
            <h1 className="font-display text-3xl font-normal">{startup.companyName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {startup.niche && (
                <span className="text-xs rounded bg-fog text-neutral-700 px-3 py-1 dark:text-neutral-300">
                  {startup.niche}
                </span>
              )}
              <RatingSummary average={average} count={reviews.length} />
            </div>
            {(responseTimeLabel || !!completedCollabs) && (
              <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1.5 dark:text-neutral-400">
                {responseTimeLabel && (
                  <span className="flex items-center gap-1">
                    <FiClock className="h-3.5 w-3.5" /> {responseTimeLabel}
                  </span>
                )}
                {responseTimeLabel && !!completedCollabs && <span>·</span>}
                {!!completedCollabs && (
                  <span>
                    collab{completedCollabs === 1 ? "" : "s"} completed: {formatFollowers(completedCollabs)}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FavoriteButton
            id={startup.id}
            initialFavorited={!!favorite}
            favoriteAction={favoriteStartupAction}
            unfavoriteAction={unfavoriteStartupAction}
          />
          <StartConversationAsCreator
            existingInterestId={existingInterest?.id ?? null}
            matchingRequests={matchingRequests}
          />
        </div>
      </div>

      {startup.description && (
        <div>
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap dark:text-neutral-300">{startup.description}</p>
        </div>
      )}

      {startup.lookingFor && (
        <div>
          <h2 className="font-semibold mb-2">What they&apos;re looking for</h2>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap dark:text-neutral-300">{startup.lookingFor}</p>
        </div>
      )}

      {(startup.website || startup.socialLinks.length > 0) && (
        <div>
          <h2 className="font-semibold mb-3">Links</h2>
          <div className="flex flex-wrap gap-2">
            {startup.website && (
              <a
                href={startup.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded border border-ink/10 px-3 py-1.5 text-sm hover:border-neutral-400 transition dark:hover:border-neutral-600"
              >
                <PlatformIcon platform="Website" className="h-4 w-4" />
                Website
              </a>
            )}
            {startup.socialLinks.map((s) => (
              <a
                key={s.platform}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded border border-ink/10 px-3 py-1.5 text-sm hover:border-neutral-400 transition dark:hover:border-neutral-600"
              >
                <PlatformIcon platform={s.platform} className="h-4 w-4" />
                {s.platform}
              </a>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Reviews from creators</h2>
        <ReviewsList reviews={reviews} />
      </div>
    </div>
  );
}
