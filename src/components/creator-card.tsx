"use client";

import { DiscoverTile } from "@/components/discover-tile";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteCreatorAction, unfavoriteCreatorAction } from "@/lib/actions/favorites";
import { useI18n } from "@/components/i18n-provider";
import { nicheLabel } from "@/lib/i18n/labels";
import { formatFollowers, isRecentlyCreated } from "@/lib/format";

type Props = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  niches: string[];
  platforms: { platform: string; followerCount: number }[];
  rating: { average: number; count: number };
  isFavorited: boolean;
  createdAt: number;
  onFavoriteToggle?: (id: string, favorited: boolean) => void;
};

// A creator in Discover's photo grid: their photo, name, niche, reach and
// rating. Platforms, language and reviews are on their page.
export function CreatorCard({
  id,
  displayName,
  avatarUrl,
  niches,
  platforms,
  rating,
  isFavorited,
  createdAt,
  onFavoriteToggle,
}: Props) {
  const { t } = useI18n();
  const reach = platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
  const labeled = niches.map((niche) => nicheLabel(t, niche));
  const nicheLine = labeled.length <= 1 ? (labeled[0] ?? "") : `${labeled[0]} +${labeled.length - 1}`;
  const facts = [
    nicheLine,
    reach > 0 ? t("screens.discover.followersCount", { count: formatFollowers(reach) }) : null,
    rating.count > 0 ? `★ ${rating.average.toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <DiscoverTile
      href={`/dashboard/startup/discover/${id}`}
      photoUrl={avatarUrl}
      name={displayName}
      avatarUrl={avatarUrl}
      showAvatar={false}
      facts={facts}
      isNew={isRecentlyCreated(createdAt)}
      favorite={
        <FavoriteButton
          id={id}
          initialFavorited={isFavorited}
          favoriteAction={favoriteCreatorAction}
          unfavoriteAction={unfavoriteCreatorAction}
          onToggle={onFavoriteToggle}
          variant="overlay"
        />
      }
    />
  );
}
