"use client";

import Image from "next/image";

// Dark mode inverts the black mark to white. At 0.16 that gray lands on the
// same tone as the field borders, so the shape disappears into them. Higher
// opacity keeps it clearly lighter than those lines.
const watermarkClass =
  "pointer-events-none absolute top-1/2 left-1/2 z-0 h-[min(168vmin,78rem)] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.11] dark:invert dark:opacity-[0.42]";

// The mark, centered on whatever page it sits in. The page supplies
// `relative` and clips overflow.
export function LogoWatermark() {
  return <Image src="/logo.png" alt="" width={2000} height={2000} priority aria-hidden className={watermarkClass} />;
}

// Sparse screens (login, 404, the error page). The mark is the page, sitting
// behind the copy, instead of a small icon stacked above the heading.
export function LogoBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <main className="logo-backdrop relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <LogoWatermark />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </main>
  );
}
