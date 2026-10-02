"use client";

import { NICHES } from "@/lib/constants";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";

// The niches as a grid of tappable tiles (radio buttons underneath, so the
// form posts `name` as before and arrow keys move between them).
export function NicheTiles({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (niche: string) => void;
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-2">
      {NICHES.map((niche) => {
        const Icon = NICHE_ICONS[niche] ?? DEFAULT_NICHE_ICON;
        return (
          <label
            key={niche}
            className="flex cursor-pointer items-center gap-3 rounded border border-neutral-300 px-4 py-3.5 text-sm font-medium transition hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink/30 dark:border-neutral-700"
          >
            <input
              type="radio"
              name={name}
              value={niche}
              required
              checked={value === niche}
              onChange={() => onChange(niche)}
              className="sr-only"
            />
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {niche}
          </label>
        );
      })}
    </div>
  );
}
