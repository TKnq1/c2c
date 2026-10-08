import Image from "next/image";

// The comtor mark without the empty margin of /logo.png, for the admin rail and the headline card. Black on transparent
// like the full logo, so it turns white in the dark theme the same way (`dark:invert`).
const RATIO = 238 / 360;

export function LogoMark({ width = 46, className = "", invert = false }: { width?: number; className?: string; invert?: boolean }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="comtor"
      width={width}
      height={Math.round(width * RATIO)}
      priority
      className={`${invert ? "invert" : "dark:invert"} ${className}`}
    />
  );
}
