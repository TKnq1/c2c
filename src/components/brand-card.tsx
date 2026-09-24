import Link from "next/link";
import { FiClock } from "react-icons/fi";
import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { RatingSummary } from "@/components/stars";
import { FavoriteButton } from "@/components/favorite-button";
import { favoriteStartupAction, unfavoriteStartupAction } from "@/lib/actions/favorites";
import { isRecentlyCreated } from "@/lib/format";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";

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
  createdAt: number;
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
  createdAt,
  responseTimeLabel,
  onFavoriteToggle,
}: Props) {
  const NicheIcon = (niche && NICHE_ICONS[niche]) || DEFAULT_NICHE_ICON;

  return (
    <Link
      href={`/dashboard/creator/discover/${id}`}
      className="relative rounded-[20px] border border-ink/10 p-5 flex flex-col gap-3 hover:border-neutral-400 transition dark:hover:border-neutral-600"
    >
      {isRecentlyCreated(createdAt) && (
        // Sits just outside the card's own corner rather than inline with
        // the name — a negative offset against the card (the nearest
        // relative ancestor), not the padded content, so it reads as a
        // sticker on the card itself instead of competing with the avatar.
        <span className="absolute -left-2 -top-2 z-10 text-[10px] font-medium uppercase tracking-wide rounded-full bg-ink text-paper px-2 py-0.5 shadow">
          New
        </span>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={avatarUrl} name={companyName} size={40} />
          <div>
            <p className="font-semibold">{companyName}</p>
            <RatingSummary average={rating.average} count={rating.count} />
            {responseTimeLabel && (
              <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5 dark:text-neutral-400">
                <FiClock className="h-3 w-3" /> {responseTimeLabel}
              </p>
            )}
          </div>
        </div>
        <FavoriteButton
          id={id}
          initialFavorited={isFavorited}
          favoriteAction={favoriteStartupAction}
          unfavoriteAction={unfavoriteStartupAction}
          onToggle={onFavoriteToggle}
        />
      </div>
      {description && <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>}
      {/* Exact same tag styling as the Feed swipe cards (see
          swipe-card.tsx's niche/followers/category/language row) — same
          rounding, padding, gap and icon size, so a tag reads as the same
          kind of element wherever it shows up in the app. */}
      {(niche || website || socialLinks.length > 0) && (
        <div className="flex flex-wrap gap-2.5 text-sm text-neutral-500 dark:text-neutral-400">
          {niche && (
            <span className="inline-flex items-center gap-1.5 rounded bg-fog px-3 py-1.5 text-neutral-700 dark:text-neutral-300">
              <NicheIcon className="h-3.5 w-3.5 shrink-0" />
              {niche}
            </span>
          )}
          {website && (
            <span className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5">
              <PlatformIcon platform="Website" className="h-3.5 w-3.5" />
              Website
            </span>
          )}
          {socialLinks.map((s) => (
            <span
              key={s.platform}
              className="inline-flex items-center gap-1.5 rounded border border-ink/10 px-2.5 py-1.5"
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
