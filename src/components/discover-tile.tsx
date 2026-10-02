import Link from "next/link";
import { Avatar } from "@/components/avatar";

// One tile in Discover's photo grid: a picture first (a brand's latest
// request photo, or a creator's own photo), then the name and one grey line
// of facts. Without a photo the tile shows the logo or initial large on
// grey, so it still looks like a choice rather than something missing.
export function DiscoverTile({
  href,
  photoUrl,
  name,
  avatarUrl,
  showAvatar,
  facts,
  isNew,
  favorite,
}: {
  href: string;
  photoUrl: string | null;
  name: string;
  avatarUrl: string | null;
  // The small avatar beside the name: a brand's logo next to its campaign
  // photo. Pointless for a creator, whose photo is the tile.
  showAvatar: boolean;
  facts: string;
  isNew: boolean;
  favorite: React.ReactNode;
}) {
  // A drawn graphic (the generated initials logos are SVG) isn't a photo:
  // stretched over the 4:5 tile it turns into a giant cropped circle. Shown
  // like a missing photo instead, as the round avatar in the middle.
  const isGraphic = photoUrl?.startsWith("data:image/svg") ?? false;
  const photo = isGraphic ? null : photoUrl;
  const avatar = isGraphic && !avatarUrl ? photoUrl : avatarUrl;

  return (
    <div className="relative flex min-w-0 flex-col gap-2">
      {/* scroll={false}: the profile opens as a panel over the list (see
          discover/@panel), which should stay where it was scrolled to. */}
      <Link href={href} scroll={false} className="group flex min-w-0 flex-col gap-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded bg-fog">
          {photo ? (
            // User-uploaded images served by our own routes — nothing for
            // next/image to optimize.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Avatar src={avatar} name={name} size={96} />
            </div>
          )}
          {isNew && (
            <span className="absolute left-2 top-2 rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
              New
            </span>
          )}
        </div>
        <div className="min-w-0 px-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            {showAvatar && photo && <Avatar src={avatar} name={name} size={20} />}
            <p className="truncate text-subhead font-bold">{name}</p>
          </div>
          <p className="line-clamp-2 text-footnote text-neutral-500 dark:text-neutral-400">{facts}</p>
        </div>
      </Link>
      {/* Outside the link, so the star doesn't sit inside an <a>. */}
      <div className="absolute right-2 top-2">{favorite}</div>
    </div>
  );
}
