import { DiscoverTile } from "@/components/discover-tile";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteStartupAction, unfavoriteStartupAction } from "@/lib/actions/favorites";
import { isRecentlyCreated } from "@/lib/format";

type Props = {
  id: string;
  companyName: string;
  avatarUrl: string | null;
  // The newest photo from the brand's requests: what they're working on.
  coverUrl: string | null;
  niche: string | null;
  rating: { average: number; count: number };
  isFavorited: boolean;
  createdAt: number;
  onFavoriteToggle?: (id: string, favorited: boolean) => void;
};

// A brand in Discover's photo grid. The rest (description, links, response
// time, reviews) is one tap away on its page.
export function BrandCard({
  id,
  companyName,
  avatarUrl,
  coverUrl,
  niche,
  rating,
  isFavorited,
  createdAt,
  onFavoriteToggle,
}: Props) {
  const facts = [niche, rating.count > 0 ? `★ ${rating.average.toFixed(1)} (${rating.count})` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <DiscoverTile
      href={`/dashboard/creator/discover/${id}`}
      photoUrl={coverUrl}
      name={companyName}
      avatarUrl={avatarUrl}
      showAvatar
      facts={facts || "Brand"}
      isNew={isRecentlyCreated(createdAt)}
      favorite={
        <FavoriteButton
          id={id}
          initialFavorited={isFavorited}
          favoriteAction={favoriteStartupAction}
          unfavoriteAction={unfavoriteStartupAction}
          onToggle={onFavoriteToggle}
          variant="overlay"
        />
      }
    />
  );
}
