"use client";

import { MAX_CREATOR_NICHES, NICHES } from "@/lib/constants";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";
import { useI18n } from "@/components/i18n-provider";
import { nicheLabel } from "@/lib/i18n/labels";

const TILE =
  "flex items-center gap-3 rounded border border-neutral-300 px-4 py-3.5 text-sm font-medium transition hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink/30 dark:border-neutral-700";

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
  const { t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t("screens.settings.niches")} className="grid grid-cols-2 gap-2">
      {NICHES.map((niche) => {
        const Icon = NICHE_ICONS[niche] ?? DEFAULT_NICHE_ICON;
        return (
          <label key={niche} className={`${TILE} cursor-pointer`}>
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
            {nicheLabel(t, niche)}
          </label>
        );
      })}
    </div>
  );
}

// The same tiles for picking several, up to `max`: checkboxes underneath,
// the rest dim out once the limit is reached. The form posts `name` as one
// comma-joined value (see nichesField in validation.ts).
export function NicheTilesMulti({
  name,
  value,
  onChange,
  max = MAX_CREATOR_NICHES,
}: {
  name: string;
  value: string[];
  onChange: (niches: string[]) => void;
  max?: number;
}) {
  const { t } = useI18n();
  const full = value.length >= max;
  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label={t("screens.settings.niches")} className="grid grid-cols-2 gap-2">
        {NICHES.map((niche) => {
          const Icon = NICHE_ICONS[niche] ?? DEFAULT_NICHE_ICON;
          const checked = value.includes(niche);
          const locked = full && !checked;
          return (
            <label
              key={niche}
              className={`${TILE} ${locked ? "cursor-not-allowed opacity-40 hover:border-neutral-300 dark:hover:border-neutral-700" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                value={niche}
                checked={checked}
                disabled={locked}
                onChange={() => onChange(checked ? value.filter((n) => n !== niche) : [...value, niche])}
                className="sr-only"
              />
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {nicheLabel(t, niche)}
            </label>
          );
        })}
      </div>
      <input type="hidden" name={name} value={value.join(",")} />
      <p aria-live="polite" className="text-xs text-neutral-500 dark:text-neutral-400">
        {t("screens.settings.nichesPicked", { count: value.length, max })}
      </p>
    </div>
  );
}
