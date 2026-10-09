// Small pure helpers of the briefing form: the deadline shortcuts and the hashtag / mention lists.

// A local calendar day as "YYYY-MM-DD", which is what a date input and the briefing hold.
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const DEADLINE_PRESETS = ["in2weeks", "in30days", "endOfMonth"] as const;
export type DeadlinePreset = (typeof DEADLINE_PRESETS)[number];

// "In 2 weeks", "In 30 days", "End of the month". The end of the month is the next one when it is less than a week away, so the
// shortcut never hands out a deadline that leaves the creator no time.
export function deadlineFor(preset: DeadlinePreset, now: Date = new Date()): string {
  const at = (days: number) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
    return localDay(d);
  };
  if (preset === "in2weeks") return at(14);
  if (preset === "in30days") return at(30);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  if (end.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() < 7 * 24 * 60 * 60 * 1000) {
    end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  }
  return localDay(end);
}

// "glowco #herbst, @glow" -> ["glowco", "herbst", "glow"]: the form keeps them space separated, without the # or @ in front.
export function splitTags(raw: string | undefined): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of (raw ?? "").split(/[\s,]+/)) {
    const tag = part.replace(/^[#@]+/, "").trim();
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  return tags;
}

export function addTags(raw: string | undefined, input: string): string {
  return splitTags(`${raw ?? ""} ${input}`).join(" ");
}

export function removeTag(raw: string | undefined, tag: string): string {
  return splitTags(raw)
    .filter((t) => t.toLowerCase() !== tag.toLowerCase())
    .join(" ");
}

// "180", "180,50" or "180.5" -> cents; anything else counts as nothing.
export function eurosToCents(raw: string | undefined): number {
  const n = Number((raw ?? "").trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}
