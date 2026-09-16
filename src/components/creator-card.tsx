import Link from "next/link";
import { FiClock } from "react-icons/fi";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { RatingSummary } from "@/components/stars";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteCreatorAction, unfavoriteCreatorAction } from "@/lib/actions/favorites";
import { formatFollowers } from "@/lib/format";

type Props = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  niche: string;
  contentLanguage: string | null;
  platforms: { platform: string; followerCount: number }[];
  rating: { average: number; count: number };
  isFavorited: boolean;
  responseTimeLabel?: string | null;
};

export function CreatorCard({
  id,
  displayName,
  avatarUrl,
  niche,
  contentLanguage,
  platforms,
  rating,
  isFavorited,
  responseTimeLabel,
}: Props) {
  return (
    <Link
      href={`/dashboard/startup/discover/${id}`}
      className="rounded-2xl border border-ink/10 p-5 flex flex-col gap-3 hover:border-neutral-400 transition dark:hover:border-neutral-600"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={avatarUrl} name={displayName} size={40} />
          <div>
            <p className="font-semibold">{displayName}</p>
            <RatingSummary average={rating.average} count={rating.count} />
            {responseTimeLabel && (
              <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5 dark:text-neutral-400">
                <FiClock className="h-3 w-3" /> {responseTimeLabel}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs rounded bg-fog text-neutral-700 px-3 py-1 whitespace-nowrap dark:text-neutral-300">
              {niche}
            </span>
            {contentLanguage && (
              <span className="text-xs rounded bg-fog text-neutral-700 px-3 py-1 whitespace-nowrap dark:text-neutral-300">
                {contentLanguage}
              </span>
            )}
          </div>
          <FavoriteButton
            id={id}
            initialFavorited={isFavorited}
            favoriteAction={favoriteCreatorAction}
            unfavoriteAction={unfavoriteCreatorAction}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        {platforms.length === 0 ? (
          <span>No platforms listed</span>
        ) : (
          platforms.map((p) => (
            <span
              key={p.platform}
              className="flex items-center gap-1.5 rounded border border-ink/10 px-2 py-1"
            >
              <PlatformIcon platform={p.platform} className="h-3.5 w-3.5" />
              {p.platform} · {formatFollowers(p.followerCount)}
            </span>
          ))
        )}
      </div>
    </Link>
  );
}
