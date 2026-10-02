import { DiscoverTile } from "@/components/discover-tile";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteCreatorAction, unfavoriteCreatorAction } from "@/lib/actions/favorites";
import { formatFollowers, formatNiches, isRecentlyCreated } from "@/lib/format";

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
  const reach = platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
  const facts = [
    formatNiches(niches),
    reach > 0 ? `${formatFollowers(reach)} followers` : null,
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
