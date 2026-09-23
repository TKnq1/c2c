import Image from "next/image";

// Two sizes only, not an open className override — the navbar (inline,
// small) and standalone pages like auth screens or 404 (the logo acts as
// a hero/branding moment there, not just a nav icon). No per-page picking
// beyond that one deliberate distinction.
//
// Sized larger than the old wordmark was: that version was a wide strip,
// so the same pixel height read as much bigger on screen. This mark is a
// square glyph, which needs more height to carry the same visual weight.
//
// next/image over a plain <img>: this renders on every single page (nav
// header, plus large on auth screens), so serving the source PNG's full
// 2000x2000/45KB at a 32-64px display height on every load added up
// across the whole site. next/image generates a properly-downsized,
// modern-format asset instead.
export function Logo({ large = false }: { large?: boolean }) {
  const size = large ? 64 : 32;
  return (
    <Image
      src="/logo.png"
      alt="C2C"
      width={size}
      height={size}
      priority
      className="dark:invert"
    />
  );
}
