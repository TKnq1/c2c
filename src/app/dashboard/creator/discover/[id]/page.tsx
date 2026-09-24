import { notFound, redirect } from "next/navigation";
import { FiClock } from "react-icons/fi";
import { IoChatbubble, IoCubeOutline, IoPeopleOutline } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeResponseTimeMs, formatResponseTime } from "@/lib/response-time";
import { getCreatorFeed } from "@/lib/visibility";
import { getMutualBlockedUserIds } from "@/lib/moderation";
import { startConversationAsCreatorAction } from "@/lib/actions/requests";
import { formatFollowers } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { RatingSummary } from "@/components/stars";
import { ReviewsList } from "@/components/reviews-list";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteStartupAction, unfavoriteStartupAction } from "@/lib/actions/favorites";
import { StartConversationAsCreator } from "@/components/start-conversation-as-creator";
import { FloatingBackButton } from "@/components/floating-back-button";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";

export default async function BrandProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  // None of these six depend on each other — they only need `id` (the route
  // param) or `session.user.id` (both already available), not each other's
  // query results, so they run as one round-trip instead of six sequential
  // ones. (`startupId: id` below is the same value `startup.id` would be
  // once fetched — no need to wait for that fetch just to restate the id we
  // already have. blockedUserIds is fetched here, not inside getCreatorFeed
  // below, for the same reason — see visibility.ts.)
  const [startup, creator, reviews, conversations, completedCollabs, blockedUserIds, openRequests] =
    await Promise.all([
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
      getMutualBlockedUserIds(session.user.id),
      prisma.request.findMany({
        where: { startupId: id, status: "OPEN" },
        orderBy: { createdAt: "desc" },
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
    getCreatorFeed(creator, blockedUserIds),
    prisma.favorite.findUnique({
      where: {
        startupId_creatorId_favoritedByRole: { startupId: startup.id, creatorId: creator.id, favoritedByRole: "CREATOR" },
      },
    }),
  ]);
  const matchingRequests = feed.filter((r) => r.startupId === startup.id);
  const matchingRequestIds = new Set(matchingRequests.map((r) => r.id));
  const NicheIcon = (startup.niche && NICHE_ICONS[startup.niche]) || DEFAULT_NICHE_ICON;

  return (
    <div className="flex flex-col gap-8">
      <FloatingBackButton />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={startup.avatarUrl} name={startup.companyName} size={64} />
          <div>
            <h1 className="font-display text-title-1 font-bold">{startup.companyName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {startup.niche && (
                <span className="inline-flex items-center gap-1.5 text-sm rounded bg-fog px-3 py-1.5 text-neutral-700 dark:text-neutral-300">
                  <NicheIcon className="h-3.5 w-3.5 shrink-0" />
                  {startup.niche}
                </span>
              )}
              {reviews.length > 0 && <RatingSummary average={average} count={reviews.length} />}
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
        </div>
      </div>

      {/* Its own full-width row under the header, not squeezed into the
          header row next to the star — same idea as a profile's Follow
          button sitting below the bio, not inline with it. */}
      <StartConversationAsCreator
        existingInterestId={existingInterest?.id ?? null}
        matchingRequests={matchingRequests}
      />

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
                className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5 text-sm hover:border-neutral-400 transition dark:hover:border-neutral-600"
              >
                <PlatformIcon platform="Website" className="h-3.5 w-3.5" />
                Website
              </a>
            )}
            {startup.socialLinks.map((s) => (
              <a
                key={s.platform}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5 text-sm hover:border-neutral-400 transition dark:hover:border-neutral-600"
              >
                <PlatformIcon platform={s.platform} className="h-3.5 w-3.5" />
                {s.platform}
              </a>
            ))}
          </div>
        </div>
      )}

      {openRequests.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Open requests</h2>
          <div className="flex flex-col gap-3">
            {openRequests.map((r, i) => {
              const ReqNicheIcon = NICHE_ICONS[r.niche] ?? DEFAULT_NICHE_ICON;
              // Only shown when the top-level button (see
              // StartConversationAsCreator) defaulted to a different
              // request because there was more than one possible match —
              // this is how you reach the others instead. With exactly one
              // match that button already covers it, and a request you
              // don't qualify for gets no button here at all rather than a
              // disabled one — that dimmed-with-a-reason treatment lives on
              // the top button now instead (see there).
              const showMessageButton = matchingRequestIds.has(r.id) && matchingRequests.length > 1;
              return (
                <div
                  key={r.id}
                  className="animate-stagger-fade-in rounded-[16px] border border-ink/10 p-4 flex flex-col gap-2"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-sm">{r.title}</p>
                    {showMessageButton && (
                      <form action={startConversationAsCreatorAction}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <button
                          type="submit"
                          aria-label={`Message about ${r.title}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-graphite"
                        >
                          <IoChatbubble className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-1.5 rounded bg-fog px-3 py-1.5 text-neutral-700 dark:text-neutral-300">
                      <ReqNicheIcon className="h-3.5 w-3.5 shrink-0" />
                      {r.niche}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5">
                      <IoPeopleOutline className="h-3.5 w-3.5 shrink-0" />
                      Min. {formatFollowers(r.minFollowers)} followers
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5">
                      <IoCubeOutline className="h-3.5 w-3.5 shrink-0" />
                      {r.productCategory}
                    </span>
                  </div>
                </div>
              );
            })}
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
