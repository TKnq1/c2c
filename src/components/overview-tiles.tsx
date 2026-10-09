import Link from "next/link";
import type { IconType } from "react-icons";
import { IoChevronForward } from "react-icons/io5";

export type OverviewTile = {
  label: string;
  value: number;
  hint: string;
  href: string;
  icon: IconType;
};

// What's waiting on the user, at the top of their home: one tile per kind,
// each linking to where it's dealt with. Tiles with something waiting stand
// out; empty ones stay quiet.
export function OverviewTiles({ tiles }: { tiles: OverviewTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {tiles.map((t) => {
        const active = t.value > 0;
        return (
          <Link
            key={t.label}
            href={t.href}
            className={`group flex flex-col gap-1.5 rounded px-4 py-3 transition md:gap-2 md:py-3.5 ${
              active ? "bg-ink text-paper hover:bg-graphite" : "bg-fog hover:bg-ink/10"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <t.icon className={`h-5 w-5 shrink-0 ${active ? "" : "text-neutral-500 dark:text-neutral-400"}`} aria-hidden />
              <IoChevronForward
                className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${active ? "opacity-70" : "text-neutral-400"}`}
                aria-hidden
              />
            </span>
            <span className="font-display text-title-1 font-bold tabular-nums leading-none">{t.value}</span>
            <span className="flex flex-col">
              <span className="text-sm font-medium">{t.label}</span>
              {/* On a phone only a tile with something waiting explains itself; the quiet ones are just a label and a 0, which is what
                  keeps the four of them from pushing the list below the fold. */}
              <span className={`text-footnote ${active ? "opacity-70" : "text-neutral-500 max-md:hidden dark:text-neutral-400"}`}>{t.hint}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
