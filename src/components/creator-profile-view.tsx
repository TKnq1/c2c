import { notFound, redirect } from "next/navigation";
import { IoArrowForward, IoLanguageOutline } from "react-icons/io5";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasBlocked } from "@/lib/moderation";
import { computeResponseTimeMs, formatResponseTimeShort } from "@/lib/response-time";
import { PlatformIcon } from "@/components/platform-icons";
import { ReviewsList } from "@/components/reviews-list";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteCreatorAction, unfavoriteCreatorAction } from "@/lib/actions/favorites";
import { ReportBlockActions } from "@/components/report-block-actions";
import { StartConversationAsStartup } from "@/components/start-conversation-as-startup";
import { formatFollowers, formatMemberSince } from "@/lib/format";
import { BackButton } from "@/components/back-button";
import { ProfileLayout, ProfileSection, ProfileTag } from "@/components/profile-layout";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";

// The profile itself, shared by its own page and by the panel Discover
// opens it in (see discover/@panel): "panel" drops the back link, which the
// panel's close button replaces, and keeps to one column.
export async function CreatorProfileView({ id, variant }: { id: string; variant: "page" | "panel" }) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  // `creator`, `startup`, and `reviews` don't depend on each other — only
  // on `id` (the route param) or `session.user.id`, both already available.
  const [creator, startup, reviews] = await Promise.all([
    prisma.creatorProfile.findUnique({
      where: { id, user: { suspendedAt: null } },
      include: { platforms: { orderBy: { followerCount: "desc" } }, user: { select: { createdAt: true } } },
    }),
    prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } }),
    prisma.review.findMany({
      where: { creatorId: id, authorRole: "STARTUP" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!creator) notFound();
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  // These all depend only on creator/startup ids resolved above, not on
  // each other, so they too run as one round-trip.
  const [blockedByMe, favorite, conversations, existingInterest, openRequests, completedCollabs] = await Promise.all([
    hasBlocked(session.user.id, creator.userId),
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
  const responseTime = formatResponseTimeShort(
    computeResponseTimeMs(
      conversations.map((c) => c.messages),
      "CREATOR",
    ),
  );
  const totalReach = creator.platforms.reduce((sum, p) => sum + p.followerCount, 0);

  return (
    <div className="flex flex-col gap-6">
      {variant === "page" && <BackButton fallbackHref="/dashboard/startup/discover" />}
      <ProfileLayout
        compact={variant === "panel"}
        name={creator.displayName}
        avatarUrl={creator.avatarUrl}
        tags={
          <>
            {creator.niches.map((niche) => {
              const NicheIcon = NICHE_ICONS[niche] ?? DEFAULT_NICHE_ICON;
              return (
                <ProfileTag key={niche} icon={<NicheIcon className="h-3.5 w-3.5" aria-hidden />}>
                  {niche}
                </ProfileTag>
              );
            })}
            {creator.contentLanguage && (
              <ProfileTag icon={<IoLanguageOutline className="h-3.5 w-3.5" aria-hidden />}>{creator.contentLanguage}</ProfileTag>
            )}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <StartConversationAsStartup
              creatorId={creator.id}
              existingInterestId={existingInterest?.id ?? null}
              openRequests={openRequests}
            />
            {/* The star's own -m-1 would otherwise eat into the gap. */}
            <span className="flex shrink-0 p-1">
              <FavoriteButton
                id={creator.id}
                initialFavorited={!!favorite}
                favoriteAction={favoriteCreatorAction}
                unfavoriteAction={unfavoriteCreatorAction}
              />
            </span>
            <ReportBlockActions
              otherUserId={creator.userId}
              otherName={creator.displayName}
              initialBlockedByMe={blockedByMe}
              bordered
            />
          </div>
        }
        stats={[
          {
            label: reviews.length ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "Rating",
            value: reviews.length ? `★ ${average.toFixed(1)}` : "–",
          },
          { label: "Collabs done", value: completedCollabs.toLocaleString("en-US") },
          { label: "Replies in", value: responseTime ?? "–" },
          { label: "Member since", value: formatMemberSince(creator.user.createdAt) },
        ]}
      >
        {creator.bio && (
          <ProfileSection title="About">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{creator.bio}</p>
          </ProfileSection>
        )}

        <ProfileSection title="Platforms" aside={totalReach > 0 ? `${formatFollowers(totalReach)} total reach` : undefined}>
          {creator.platforms.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No platforms listed.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {creator.platforms.map((p) => {
                const body = (
                  <>
                    <PlatformIcon platform={p.platform} className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{p.platform}</span>
                      <span className="block text-footnote text-neutral-500 tabular-nums dark:text-neutral-400">
                        {p.followerCount.toLocaleString("en-US")} followers
                      </span>
                    </span>
                    {p.url && <IoArrowForward className="h-4 w-4 shrink-0 -rotate-45 text-neutral-400" aria-hidden />}
                  </>
                );
                return (
                  <li key={p.platform}>
                    {/* Profiles from before links were required may not have one. */}
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${creator.displayName} on ${p.platform}`}
                        className="flex items-center gap-3 rounded bg-fog px-4 py-3 transition hover:bg-ink/5"
                      >
                        {body}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 rounded bg-fog px-4 py-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ProfileSection>

        <ProfileSection title="Reviews from brands">
          <ReviewsList reviews={reviews} />
        </ProfileSection>
      </ProfileLayout>
    </div>
  );
}
