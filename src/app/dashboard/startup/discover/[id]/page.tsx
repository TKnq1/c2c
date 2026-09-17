import { notFound, redirect } from "next/navigation";
import { FiClock } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isBlocked } from "@/lib/moderation";
import { computeResponseTimeMs, formatResponseTime } from "@/lib/response-time";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { RatingSummary } from "@/components/stars";
import { ReviewsList } from "@/components/reviews-list";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteCreatorAction, unfavoriteCreatorAction } from "@/lib/actions/favorites";
import { ReportBlockActions } from "@/components/report-block-actions";
import { StartConversationAsStartup } from "@/components/start-conversation-as-startup";
import { formatFollowers } from "@/lib/format";

export default async function CreatorProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  // `creator`, `startup`, and `reviews` don't depend on each other — only
  // on `id` (the route param) or `session.user.id`, both already available.
  const [creator, startup, reviews] = await Promise.all([
    prisma.creatorProfile.findUnique({
      where: { id },
      include: { platforms: true },
    }),
    prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.review.findMany({
      where: { creatorId: id, authorRole: "STARTUP" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!creator) notFound();
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // These six all depend only on creator/startup ids resolved above, not on
  // each other, so they too run as one round-trip.
  const [blocked, favorite, conversations, existingInterest, openRequests, completedCollabs] = await Promise.all([
    isBlocked(session.user.id, creator.userId),
    prisma.favorite.findUnique({
      where: {
        startupId_creatorId_favoritedByRole: { startupId: startup.id, creatorId: creator.id, favoritedByRole: "STARTUP" },
      },
    }),
    prisma.interest.findMany({
      where: { creatorId: creator.id },
      select: { messages: { orderBy: { createdAt: "asc" }, select: { senderRole: true, createdAt: true } } },
    }),
    prisma.interest.findFirst({
      where: { creatorId: creator.id, request: { startupId: startup.id } },
      select: { id: true },
    }),
    prisma.request.findMany({
      where: { startupId: startup.id, status: "OPEN" },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interest.count({
      where: { creatorId: creator.id, paymentStatus: "RELEASED" },
    }),
  ]);
  const responseTimeLabel = formatResponseTime(
    computeResponseTimeMs(
      conversations.map((c) => c.messages),
      "CREATOR",
    ),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={creator.avatarUrl} name={creator.displayName} size={64} />
          <div>
            <h1 className="font-display text-3xl font-normal">{creator.displayName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs rounded bg-fog text-neutral-700 px-3 py-1 dark:text-neutral-300">
                {creator.niche}
              </span>
              {creator.contentLanguage && (
                <span className="text-xs rounded bg-fog text-neutral-700 px-3 py-1 dark:text-neutral-300">
                  {creator.contentLanguage}
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
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <FavoriteButton
              id={creator.id}
              initialFavorited={!!favorite}
              favoriteAction={favoriteCreatorAction}
              unfavoriteAction={unfavoriteCreatorAction}
            />
            <StartConversationAsStartup
              creatorId={creator.id}
              existingInterestId={existingInterest?.id ?? null}
              openRequests={openRequests}
            />
          </div>
          <ReportBlockActions otherUserId={creator.userId} initialBlocked={blocked} />
        </div>
      </div>

      {creator.bio && (
        <div>
          <h2 className="font-semibold mb-2">About</h2>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap dark:text-neutral-300">{creator.bio}</p>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Platforms</h2>
        {creator.platforms.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No platforms listed.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {creator.platforms.map((p) => {
              const Tag = p.url ? "a" : "span";
              return (
                <Tag
                  key={p.platform}
                  {...(p.url ? { href: p.url, target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`flex items-center gap-1.5 rounded border border-ink/10 px-3 py-1.5 text-sm ${
                    p.url ? "hover:border-neutral-400 transition dark:hover:border-neutral-600" : ""
                  }`}
                >
                  <PlatformIcon platform={p.platform} className="h-4 w-4" />
                  {p.platform} · {formatFollowers(p.followerCount)}
                </Tag>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Reviews from brands</h2>
        <ReviewsList reviews={reviews} />
      </div>
    </div>
  );
}
