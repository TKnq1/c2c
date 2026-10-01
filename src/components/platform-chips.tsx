"use client";

import { IoClose } from "react-icons/io5";
import { PLATFORMS } from "@/lib/constants";
import { PlatformIcon } from "@/components/platform-icons";

export type PlatformDraft = { platform: string; followers: string; url: string };

// Onboarding's platform input: tap a platform's chip to add it, then fill in
// its followers (and optionally a link) in the row that appears. Posts the
// same JSON as PlatformPicker; rows without a follower count are left out
// (the step's Continue stays disabled until every row has one).
export function PlatformChips({
  name,
  value,
  onChange,
}: {
  name: string;
  value: PlatformDraft[];
  onChange: (entries: PlatformDraft[]) => void;
}) {
  const selected = new Set(value.map((e) => e.platform));
  const serialized = value
    .filter((e) => e.followers !== "")
    .map((e) => ({ platform: e.platform, followerCount: Number(e.followers), ...(e.url.trim() ? { url: e.url.trim() } : {}) }));

  const toggle = (platform: string) =>
    onChange(selected.has(platform) ? value.filter((e) => e.platform !== platform) : [...value, { platform, followers: "", url: "" }]);
  const update = (platform: string, patch: Partial<PlatformDraft>) =>
    onChange(value.map((e) => (e.platform === platform ? { ...e, ...patch } : e)));

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={JSON.stringify(serialized)} />

      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((platform) => {
          const on = selected.has(platform);
          return (
            <button
              key={platform}
              type="button"
              onClick={() => toggle(platform)}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                on ? "border-ink bg-ink text-paper" : "border-neutral-300 hover:border-ink dark:border-neutral-700"
              }`}
            >
              <PlatformIcon platform={platform} mono={on} className="h-4 w-4 shrink-0" />
              {platform}
            </button>
          );
        })}
      </div>

      {value.map((e) => (
        <div key={e.platform} className="animate-stagger-fade-in flex flex-col gap-2 rounded bg-fog p-3">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={e.platform} className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-sm font-medium">{e.platform}</span>
            <button
              type="button"
              onClick={() => toggle(e.platform)}
              aria-label={`Remove ${e.platform}`}
              className="text-neutral-500 transition hover:text-ink dark:text-neutral-400"
            >
              <IoClose className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              required
              placeholder="Followers"
              aria-label={`${e.platform} followers`}
              value={e.followers}
              onChange={(ev) => update(e.platform, { followers: ev.target.value })}
              className="w-32 shrink-0 rounded border border-neutral-300 bg-background px-3 py-2.5 dark:border-neutral-700"
            />
            <input
              type="url"
              placeholder="Profile link (optional)"
              aria-label={`${e.platform} profile link`}
              value={e.url}
              onChange={(ev) => update(e.platform, { url: ev.target.value })}
              className="min-w-0 flex-1 rounded border border-neutral-300 bg-background px-3 py-2.5 dark:border-neutral-700"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
