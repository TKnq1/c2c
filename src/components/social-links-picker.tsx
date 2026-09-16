"use client";

import { useState } from "react";
import { PLATFORMS } from "@/lib/constants";
import { Select } from "@/components/select";
import { PlatformIcon } from "@/components/platform-icons";

type SocialLinkEntry = { platform: string; url: string };

export function SocialLinksPicker({
  name,
  initial = [],
}: {
  name: string;
  initial?: SocialLinkEntry[];
}) {
  const [entries, setEntries] = useState<SocialLinkEntry[]>(initial);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [url, setUrl] = useState("");

  const available = PLATFORMS.filter((p) => !entries.some((e) => e.platform === p));

  function addEntry() {
    if (!selectedPlatform || url.trim() === "") return;
    setEntries([...entries, { platform: selectedPlatform, url: url.trim() }]);
    setSelectedPlatform("");
    setUrl("");
  }

  function removeEntry(platform: string) {
    setEntries(entries.filter((e) => e.platform !== platform));
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={JSON.stringify(entries)} />

      {entries.length > 0 && (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <div
              key={e.platform}
              className="flex items-center justify-between gap-3 rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700"
            >
              <span className="flex items-center gap-2 text-sm truncate">
                <PlatformIcon platform={e.platform} className="h-4 w-4 text-neutral-600 shrink-0 dark:text-neutral-400" />
                <span className="font-medium">{e.platform}</span>{" "}
                <span className="text-neutral-500 truncate dark:text-neutral-400">{e.url}</span>
              </span>
              <button
                type="button"
                onClick={() => removeEntry(e.platform)}
                className="text-sm text-neutral-500 hover:text-ink transition shrink-0 dark:text-neutral-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex gap-2">
          <Select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            wrapperClassName="w-40 shrink-0"
          >
            <option value="">Platform</option>
            {available.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <input
            type="url"
            placeholder="https://…"
            aria-label="Profile URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 flex-1 min-w-0 dark:border-neutral-700"
          />
          <button
            type="button"
            onClick={addEntry}
            disabled={!selectedPlatform || url.trim() === ""}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 transition disabled:opacity-50 whitespace-nowrap dark:border-neutral-700 dark:hover:bg-neutral-800/50"
          >
            + Add
          </button>
        </div>
      )}
    </div>
  );
}
