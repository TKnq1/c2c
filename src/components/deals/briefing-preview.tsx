"use client";

import { POST_FORMATS, isPostFormat } from "@/lib/social/platforms";
import { splitTags } from "@/lib/compliance/briefing-helpers";
import type { FormValues } from "@/lib/compliance/briefing-form";
import { formatDealDay } from "@/lib/deals/notices";
import type { DealLocale } from "@/lib/deals/copy";
import { PlatformIcon } from "@/components/platform-icons";
import { useDealText } from "@/components/deals/use-deal-text";

const csv = (value: string | undefined) => (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);

// What the creator will see of the briefing, as a card: the formats with their icons, the key message, what to avoid, the tags, the
// deadline and the label. It moves with every keystroke, so writing the message shows at once how it reads.
export function BriefingPreview({ values, brandName, requestTitle, language }: { values: FormValues; brandName: string; requestTitle: string; language: DealLocale }) {
  const u = useDealText();
  const formats = csv(values.contentFormats).filter(isPostFormat);
  const hashtags = splitTags(values.requiredHashtags);
  const mentions = splitTags(values.requiredMentions);
  const message = (values.talkingPoints ?? "").trim();
  const avoid = (values.doNots ?? "").trim();

  return (
    <details open className="group rounded border border-ink/10 bg-paper p-4">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {u("briefing.preview.title")}
        <span aria-hidden className="text-neutral-500 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-on-accent">
            {brandName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{brandName}</p>
            <p className="truncate font-bold">{requestTitle}</p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2 text-sm">
          {formats.length === 0 && <li className="text-neutral-500 dark:text-neutral-400">{u("briefing.preview.noFormats")}</li>}
          {formats.map((f) => (
            <li key={f} className="inline-flex items-center gap-1.5 rounded bg-fog px-2.5 py-1.5">
              <PlatformIcon platform={POST_FORMATS[f].platform} className="h-3.5 w-3.5" />
              {POST_FORMATS[f].label}
            </li>
          ))}
          {values.postingWindowEnd && (
            <li className="inline-flex items-center rounded border border-ink/10 px-2.5 py-1.5">{u("briefing.preview.postBy", { date: formatDealDay(values.postingWindowEnd, language) })}</li>
          )}
        </ul>
        <p className={`border-l-2 pl-3 text-sm ${message ? "border-accent" : "border-ink/10 text-neutral-500 dark:text-neutral-400"}`}>{message || u("briefing.preview.noMessage")}</p>
        {avoid && (
          <p className="text-sm">
            <span className="font-medium">{u("briefing.preview.avoid")}: </span>
            <span className="text-neutral-600 dark:text-neutral-400">{avoid}</span>
          </p>
        )}
        {(hashtags.length > 0 || mentions.length > 0) && (
          <p className="flex flex-wrap gap-x-2 gap-y-1 text-sm font-medium text-accent">
            {hashtags.map((t) => (
              <span key={`h-${t}`}>#{t}</span>
            ))}
            {mentions.map((t) => (
              <span key={`m-${t}`}>@{t}</span>
            ))}
          </p>
        )}
        {csv(values.disclosureLabels).length > 0 && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{u("briefing.preview.label", { labels: csv(values.disclosureLabels).join(" / ") })}</p>
        )}
      </div>
    </details>
  );
}
