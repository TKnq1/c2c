"use client";

import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";

// A date formatted on the server comes out in the server's zone (UTC on
// Vercel), so a payment made late in the evening in Berlin would show as
// the day before. Server pages pass the timestamp; this formats it in the
// viewer's own zone. "Sep 25, 2026" rather than "9/25/2026", which reads
// as a different date to anyone used to day-first order.
export function LocalDate({ ms }: { ms: number }) {
  const timeZone = useViewerTimeZone();
  return new Date(ms).toLocaleDateString("en-US", { timeZone, month: "short", day: "numeric", year: "numeric" });
}
