import Image from "next/image";

// Two sizes only, not an open className override — the navbar (inline,
// small) and standalone pages like auth screens or 404 (the logo acts as
// a hero/branding moment there, not just a nav icon). No per-page picking
// beyond that one deliberate distinction.
//
// next/image over a plain <img>: this renders on every single page (nav
// header, twice — desktop bar and mobile drawer — plus large on auth
// screens), so serving the source PNG's full 1520x704/45KB at a 24-40px
// display height on every load added up across the whole site. next/image
// generates a properly-downsized, modern-format asset instead.
const LOGO_ASPECT = 1520 / 704;

export function Logo({ large = false }: { large?: boolean }) {
  const height = large ? 40 : 24;
  return (
    <Image
      src="/logo.png"
      alt="C2C"
      width={Math.round(height * LOGO_ASPECT)}
      height={height}
      priority
      className="dark:invert"
    />
  );
}
