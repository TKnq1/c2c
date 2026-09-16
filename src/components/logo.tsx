// Two sizes only, not an open className override — the navbar (inline,
// small) and standalone pages like auth screens or 404 (the logo acts as
// a hero/branding moment there, not just a nav icon). No per-page picking
// beyond that one deliberate distinction.
export function Logo({ large = false }: { large?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="C2C" className={`${large ? "h-10" : "h-6"} dark:invert`} />;
}
