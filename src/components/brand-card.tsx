import Link from "next/link";
import { FiClock } from "react-icons/fi";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { RatingSummary } from "@/components/stars";
import { FavoriteButton } from "@/components/favorite-button";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { favoriteStartupAction, unfavoriteStartupAction } from "@/lib/actions/favorites";

type Props = {
  id: string;
  companyName: string;
  avatarUrl: string | null;
  niche: string | null;
  description: string | null;
  website: string | null;
  socialLinks: { platform: string; url: string }[];
  rating: { average: number; count: number };
  isFavorited: boolean;
  responseTimeLabel?: string | null;
  onFavoriteToggle?: (id: string, favorited: boolean) => void;
};

export function BrandCard({
  id,
  companyName,
  avatarUrl,
  niche,
  description,
  website,
  socialLinks,
  rating,
  isFavorited,
  responseTimeLabel,
  onFavoriteToggle,
}: Props) {
  return (
    <Link
      href={`/dashboard/creator/discover/${id}`}
      className="rounded-2xl border border-ink/10 p-5 flex flex-col gap-3 hover:border-neutral-400 transition dark:hover:border-neutral-600"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={avatarUrl} name={companyName} size={40} />
          <div>
            <p className="font-semibold flex items-center">
              {companyName}
              <LinkPendingIndicator />
            </p>
            <RatingSummary average={rating.average} count={rating.count} />
            {responseTimeLabel && (
              <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5 dark:text-neutral-400">
                <FiClock className="h-3 w-3" /> {responseTimeLabel}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {niche && (
            <span className="text-xs rounded bg-fog text-neutral-700 px-3 py-1 whitespace-nowrap dark:text-neutral-300">
              {niche}
            </span>
          )}
          <FavoriteButton
            id={id}
            initialFavorited={isFavorited}
            favoriteAction={favoriteStartupAction}
            unfavoriteAction={unfavoriteStartupAction}
            onToggle={onFavoriteToggle}
          />
        </div>
      </div>
      {description && <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>}
      {(website || socialLinks.length > 0) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {website && (
            <span className="flex items-center gap-1.5 rounded border border-ink/10 px-2 py-1 text-neutral-600 dark:text-neutral-400">
              <PlatformIcon platform="Website" className="h-3.5 w-3.5" />
              Website
            </span>
          )}
          {socialLinks.map((s) => (
            <span
              key={s.platform}
              className="flex items-center gap-1.5 rounded border border-ink/10 px-2 py-1 text-neutral-600 dark:text-neutral-400"
            >
              <PlatformIcon platform={s.platform} className="h-3.5 w-3.5" />
              {s.platform}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
