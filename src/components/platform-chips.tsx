"use client";

import { IoClose } from "react-icons/io5";
import { PLATFORMS } from "@/lib/constants";
import { PlatformIcon } from "@/components/platform-icons";
import { useI18n } from "@/components/i18n-provider";

export type PlatformDraft = { platform: string; followers: string; url: string };

// A creator's platforms (onboarding and settings): tap a platform's chip to
// add it, then fill in its followers and the link to the profile there in
// the row that appears. Both are required — the link is what a brand opens
// from the profile — so the inputs carry `required` and the form won't
// submit with one missing. Posts the rows as JSON in one hidden field.
// An empty link says so in its row: the browser's own "fill out this field"
// bubble is easy to miss (not shown at all on some phones), so Save, or the
// wizard's Continue, looked like it did nothing.
export function PlatformChips({
  name,
  value,
  onChange,
}: {
  name: string;
  value: PlatformDraft[];
  onChange: (entries: PlatformDraft[]) => void;
}) {
  const { t } = useI18n();
  const selected = new Set(value.map((e) => e.platform));
  const serialized = value.map((e) => ({ platform: e.platform, followerCount: Number(e.followers), url: e.url.trim() }));

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
        <div key={e.platform} className="animate-stagger-fade-in flex flex-col gap-2 rounded border border-ink/10 p-3">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={e.platform} className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-sm font-medium">{e.platform}</span>
            <button
              type="button"
              onClick={() => toggle(e.platform)}
              aria-label={t("screens.settings.removePlatform", { name: e.platform })}
              className="flex h-11 w-11 items-center justify-center text-neutral-500 transition hover:text-ink dark:text-neutral-400"
            >
              <IoClose className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex gap-2">
            <label className="flex w-32 shrink-0 flex-col gap-1 text-xs font-medium">
              <span>
                {t("screens.settings.followers")} <span aria-hidden>*</span>
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                required
                placeholder="e.g. 12000"
                aria-label={t("screens.settings.followersOf", { name: e.platform })}
                value={e.followers}
                onChange={(ev) => update(e.platform, { followers: ev.target.value })}
                className="rounded border border-neutral-300 bg-background px-3 py-2.5 text-base font-normal dark:border-neutral-700"
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium">
              <span>
                {t("screens.settings.profileLink")} <span aria-hidden>*</span>
              </span>
              <input
                type="url"
                required
                placeholder="https://"
                aria-label={t("screens.settings.linkOf", { name: e.platform })}
                value={e.url}
                onChange={(ev) => update(e.platform, { url: ev.target.value })}
                className="min-w-0 rounded border border-neutral-300 bg-background px-3 py-2.5 text-base font-normal dark:border-neutral-700"
              />
            </label>
          </div>
          {e.url.trim() === "" && (
            <p className="text-xs font-medium text-ink">
              The link to your {e.platform} profile is required. Brands open it from your profile.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
