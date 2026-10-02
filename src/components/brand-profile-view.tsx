import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeResponseTimeMs, formatResponseTimeShort } from "@/lib/response-time";
import { getCreatorFeed } from "@/lib/visibility";
import { getMutualBlockedUserIds } from "@/lib/moderation";
import { formatMemberSince } from "@/lib/format";
import { photoUrlsByRequestId, requestPhotoIds } from "@/lib/request-photos";
import { PlatformIcon } from "@/components/platform-icons";
import { ReviewsList } from "@/components/reviews-list";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteStartupAction, unfavoriteStartupAction } from "@/lib/actions/favorites";
import { StartConversationAsCreator } from "@/components/start-conversation-as-creator";
import { BackButton } from "@/components/back-button";
import { BrandRequestList } from "@/components/brand-request-list";
import { ProfileLayout, ProfileSection, ProfileTag } from "@/components/profile-layout";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";

const LINK_CHIP =
  "inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5 text-sm transition hover:border-neutral-400 dark:hover:border-neutral-600";

// The profile itself, shared by its own page and by the panel Discover
// opens it in (see discover/@panel): "panel" drops the back link, which the
// panel's close button replaces, and keeps to one column.
export async function BrandProfileView({ id, variant }: { id: string; variant: "page" | "panel" }) {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") redirect("/login");

  // None of these depend on each other — they only need `id` (the route
  // param) or `session.user.id`, so they run as one round-trip.
  // (`startupId: id` below is the same value `startup.id` would be once
  // fetched. blockedUserIds is fetched here, not inside getCreatorFeed, for
  // the same reason — see visibility.ts.)
  const [startup, creator, reviews, conversations, completedCollabs, blockedUserIds, openRequests] =
    await Promise.all([
      prisma.startupProfile.findUnique({
        where: { id, user: { suspendedAt: null } },
        include: { socialLinks: true, user: { select: { createdAt: true } } },
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
        omit: { imageUrl: true },
        include: requestPhotoIds,
        orderBy: { createdAt: "desc" },
      }),
    ]);
  if (!startup) notFound();

  const [myInterests, feed, favorite, photos] = await Promise.all([
    prisma.interest.findMany({
      where: { creatorId: creator.id, request: { startupId: startup.id } },
      select: { id: true, requestId: true },
    }),
    // "all": what a creator may reach out about doesn't depend on their niches.
    getCreatorFeed(creator, blockedUserIds, "all"),
    prisma.favorite.findUnique({
      where: {
        startupId_creatorId_favoritedByRole: { startupId: startup.id, creatorId: creator.id, favoritedByRole: "CREATOR" },
      },
    }),
    photoUrlsByRequestId(openRequests),
  ]);
  const matchingRequests = feed.filter((r) => r.startupId === startup.id);
  const matchingIds = new Set(matchingRequests.map((r) => r.id));
  const interestByRequest = new Map(myInterests.map((i) => [i.requestId, i.id]));

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const responseTime = formatResponseTimeShort(
    computeResponseTimeMs(
      conversations.map((c) => c.messages),
      "STARTUP",
    ),
  );
  const NicheIcon = (startup.niche && NICHE_ICONS[startup.niche]) || DEFAULT_NICHE_ICON;

  return (
    <div className="flex flex-col gap-6">
      {variant === "page" && <BackButton fallbackHref="/dashboard/creator/discover" />}
      <ProfileLayout
        compact={variant === "panel"}
        name={startup.companyName}
        avatarUrl={startup.avatarUrl}
        tags={startup.niche && <ProfileTag icon={<NicheIcon className="h-3.5 w-3.5" aria-hidden />}>{startup.niche}</ProfileTag>}
        actions={
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <StartConversationAsCreator
                existingInterestId={myInterests[0]?.id ?? null}
                matchingRequests={matchingRequests}
              />
              {/* The star's own -m-1 would otherwise eat into the gap. */}
              <span className="flex shrink-0 p-1">
                <FavoriteButton
                  id={startup.id}
                  initialFavorited={!!favorite}
                  favoriteAction={favoriteStartupAction}
                  unfavoriteAction={unfavoriteStartupAction}
                />
              </span>
            </div>
            {myInterests.length === 0 && matchingRequests.length === 0 && (
              <p className="text-xs text-neutral-500 lg:text-center dark:text-neutral-400">
                You don&apos;t match their open requests yet.
              </p>
            )}
          </div>
        }
        stats={[
          { label: reviews.length ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "Rating", value: reviews.length ? `★ ${average.toFixed(1)}` : "–" },
          { label: "Collabs done", value: completedCollabs.toLocaleString("en-US") },
          { label: "Replies in", value: responseTime ?? "–" },
          { label: "Member since", value: formatMemberSince(startup.user.createdAt) },
        ]}
      >
        {startup.description && (
          <ProfileSection title="About">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{startup.description}</p>
          </ProfileSection>
        )}

        {startup.lookingFor && (
          <ProfileSection title="What they're looking for">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{startup.lookingFor}</p>
          </ProfileSection>
        )}

        {(startup.website || startup.socialLinks.length > 0) && (
          <ProfileSection title="Links">
            <div className="flex flex-wrap gap-2">
              {startup.website && (
                <a href={startup.website} target="_blank" rel="noopener noreferrer" className={LINK_CHIP}>
                  <PlatformIcon platform="Website" className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
              {startup.socialLinks.map((s) => (
                <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" className={LINK_CHIP}>
                  <PlatformIcon platform={s.platform} className="h-3.5 w-3.5" />
                  {s.platform}
                </a>
              ))}
            </div>
          </ProfileSection>
        )}

        {openRequests.length > 0 && (
          <ProfileSection title="Open requests" aside={openRequests.length}>
            <BrandRequestList
              companyName={startup.companyName}
              companyAvatarUrl={startup.avatarUrl}
              requests={openRequests.map((r) => ({
                id: r.id,
                title: r.title,
                description: r.description,
                photos: photos.get(r.id) ?? [],
                budgetMinCents: r.budgetMinCents,
                budgetMaxCents: r.budgetMaxCents,
                platform: r.platform,
                deliverables: r.deliverables,
                postBy: r.postBy ? r.postBy.toISOString().slice(0, 10) : null,
                productIncluded: r.productIncluded,
                productCategory: r.productCategory,
                niche: r.niche,
                languages: r.languages,
                minFollowers: r.minFollowers,
                interestId: interestByRequest.get(r.id) ?? null,
                matches: matchingIds.has(r.id),
              }))}
            />
          </ProfileSection>
        )}

        <ProfileSection title="Reviews from creators">
          <ReviewsList reviews={reviews} />
        </ProfileSection>
      </ProfileLayout>
    </div>
  );
}
