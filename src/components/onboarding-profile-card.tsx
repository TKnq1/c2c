"use client";

import { Avatar } from "@/components/avatar";
import { PlatformIcon } from "@/components/platform-icons";
import { DEFAULT_NICHE_ICON, NICHE_ICONS } from "@/lib/niche-icons";
import { formatFollowers } from "@/lib/format";

export type CardPlatform = { platform: string; followers: string };

// The profile as the other side will see it, filling in while the wizard
// goes: every empty slot is something the next steps will fill, and a slot
// that just got a value pops. Replaces a plain progress bar as the thing to
// look at, and doubles as the photo step's preview.
export function OnboardingProfileCard({
  role,
  name,
  avatarUrl,
  niches,
  platforms = [],
}: {
  role: "creator" | "brand";
  name: string;
  avatarUrl: string | null;
  niches: string[];
  platforms?: CardPlatform[];
}) {
  const audience = role === "creator" ? "brands" : "creators";
  const trimmed = name.trim();
  const reach = platforms.filter((p) => Number(p.followers) > 0);

  return (
    <section aria-label={`How ${audience} will see you`} className="rounded bg-fog px-4 py-3.5">
      <p className="mb-2.5 text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
        How {audience} will see you
      </p>
      <div className="flex items-center gap-3">
        <div key={avatarUrl ?? "none"} className={avatarUrl ? "animate-pop-in" : undefined}>
          <Avatar src={avatarUrl} name={trimmed || "?"} size={48} />
        </div>
        <div className="min-w-0 flex-1">
          {trimmed ? (
            <p className="truncate font-semibold">{trimmed}</p>
          ) : (
            <Placeholder width="w-32" label={role === "creator" ? "Your name" : "Your company"} />
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {niches.length > 0 ? (
              niches.map((niche) => {
                const Icon = NICHE_ICONS[niche] ?? DEFAULT_NICHE_ICON;
                return (
                  <span
                    key={niche}
                    className="animate-pop-in inline-flex items-center gap-1 text-footnote text-neutral-600 dark:text-neutral-400"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {niche}
                  </span>
                );
              })
            ) : (
              <Placeholder width="w-24" label={role === "creator" ? "Your niches" : "Your niche"} />
            )}
          </div>
        </div>
      </div>

      {role === "creator" && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
          {reach.length > 0 ? (
            reach.map((p) => (
              <span
                key={p.platform}
                className="animate-pop-in inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-2.5 py-1 text-footnote"
              >
                <PlatformIcon platform={p.platform} className="h-3.5 w-3.5 shrink-0" />
                <span className="font-semibold tabular-nums">{formatFollowers(Number(p.followers))}</span>
              </span>
            ))
          ) : (
            <Placeholder width="w-28" label="Your reach" />
          )}
        </div>
      )}
    </section>
  );
}

// An empty slot: a dashed line with a small label, so it reads as "not yet"
// rather than as a broken layout.
function Placeholder({ width, label }: { width: string; label: string }) {
  return (
    <span className={`inline-flex h-5 ${width} items-center rounded border border-dashed border-neutral-300 px-2 text-xs text-neutral-400 dark:border-neutral-700 dark:text-neutral-500`}>
      {label}
    </span>
  );
}
