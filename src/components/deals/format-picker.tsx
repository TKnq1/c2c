"use client";

import { useState } from "react";
import { POST_FORMATS, POST_FORMAT_CODES, type PostFormat, type SocialPlatform } from "@/lib/social/platforms";
import { PlatformIcon } from "@/components/platform-icons";
import { Check } from "@/components/deals/choice-button";
import { useDealText } from "@/components/deals/use-deal-text";

const PLATFORMS: SocialPlatform[] = ["Instagram", "TikTok", "YouTube"];

// "Instagram Reel" -> "Reel": the platform is the button above, the format is what is asked for under it.
function formatName(code: PostFormat): string {
  const { platform, label } = POST_FORMATS[code];
  return label.startsWith(platform) ? label.slice(platform.length).trim() : label;
}

// Which content a brand books: first the platform (a button with its icon), then, folded out under the row, the formats of the
// platforms that were opened (Reel, Post, Story, ...). A platform with a format chosen is filled and counts them; closing its panel
// keeps what was chosen.
export function FormatPicker({ selected, onToggle }: { selected: string[]; onToggle: (code: PostFormat, on: boolean) => void }) {
  const u = useDealText();
  const countOf = (platform: SocialPlatform) => POST_FORMAT_CODES.filter((c) => POST_FORMATS[c].platform === platform && selected.includes(c)).length;
  const [open, setOpen] = useState<Set<SocialPlatform>>(() => new Set(PLATFORMS.filter((p) => countOf(p) > 0)));
  const toggleOpen = (platform: SocialPlatform) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {PLATFORMS.map((platform) => {
          const count = countOf(platform);
          const on = count > 0;
          const expanded = open.has(platform);
          return (
            <button
              key={platform}
              type="button"
              aria-expanded={expanded}
              aria-controls={`format-panel-${platform}`}
              onClick={() => toggleOpen(platform)}
              className={`relative flex flex-col items-center gap-1.5 rounded border px-2 py-3.5 text-sm font-medium transition ${
                on ? "border-ink bg-ink text-paper" : expanded ? "border-ink" : "border-neutral-300 hover:border-ink dark:border-neutral-700"
              }`}
            >
              <PlatformIcon platform={platform} mono={on} className="h-6 w-6" />
              {platform}
              {on && (
                <span className="absolute top-1.5 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-paper px-1 text-[11px] font-bold text-ink">{count}</span>
              )}
            </button>
          );
        })}
      </div>
      {PLATFORMS.filter((p) => open.has(p)).map((platform) => (
        <div key={platform} id={`format-panel-${platform}`} className="animate-stagger-fade-in flex flex-col gap-2 rounded border border-ink/10 bg-paper p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <PlatformIcon platform={platform} className="h-4 w-4" />
            {u("briefing.formats.pick", { platform })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {POST_FORMAT_CODES.filter((c) => POST_FORMATS[c].platform === platform).map((c) => (
              <Check key={c} checked={selected.includes(c)} onChange={(on) => onToggle(c, on)} label={formatName(c)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
