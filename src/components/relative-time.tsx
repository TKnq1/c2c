"use client";

import { dateLocale, formatRelativeTime } from "@/lib/format";
import { useI18n } from "@/components/i18n-provider";
import { useNow } from "@/lib/use-now";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";

// "5 min ago", "Yesterday", "Sep 28", with the exact date and time on
// hover. The server renders the exact one, since it can't know the
// viewer's "now"; the relative one takes over on the client.
export function RelativeTime({ ms }: { ms: number }) {
  const { locale } = useI18n();
  const timeZone = useViewerTimeZone();
  const now = useNow();
  const exact = new Date(ms).toLocaleString(dateLocale(locale), { timeZone, dateStyle: "medium", timeStyle: "short" });
  return (
    <time dateTime={new Date(ms).toISOString()} title={exact}>
      {now === null ? exact : formatRelativeTime(ms, now, timeZone, locale)}
    </time>
  );
}
