import type { IconType } from "react-icons";
import { SiInstagram, SiTiktok, SiYoutube, SiTwitch, SiX } from "react-icons/si";
import { FiLink } from "react-icons/fi";

// Official brand icons (react-icons/si — Simple Icons) with each brand's own
// color. TikTok and X brand black — invisible on a dark background — so
// those two use a themed class instead of a fixed color.
const ICONS: Record<string, { Icon: IconType; color?: string; colorClassName?: string }> = {
  Instagram: { Icon: SiInstagram, color: "#E4405F" },
  TikTok: { Icon: SiTiktok, colorClassName: "text-black dark:text-white" },
  YouTube: { Icon: SiYoutube, color: "#FF0000" },
  Twitch: { Icon: SiTwitch, color: "#9146FF" },
  X: { Icon: SiX, colorClassName: "text-black dark:text-white" },
};

/**
 * Small platform mark in each brand's own color. Falls back to a plain
 * neutral link icon for "Website" or anything unrecognized. `mono` drops
 * the brand color for the surrounding text color instead — for marks on a
 * photo, where a red or purple logo would fight the picture.
 */
export function PlatformIcon({ platform, className, mono }: { platform: string; className?: string; mono?: boolean }) {
  const entry = ICONS[platform];
  if (!entry) return <FiLink className={className ?? "h-4 w-4"} />;
  const { Icon, color, colorClassName } = entry;
  if (mono) return <Icon className={className ?? "h-4 w-4"} />;
  return (
    <Icon
      className={`${className ?? "h-4 w-4"} ${colorClassName ?? ""}`}
      style={color ? { color } : undefined}
    />
  );
}
