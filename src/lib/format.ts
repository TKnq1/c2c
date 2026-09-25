// EUR to match the actual Stripe Checkout/Connect currency (see
// src/lib/actions/payments.ts) — a mismatch here would mean an amount
// displayed as e.g. "$250" is really charged as €250.
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

// Follower counts drift constantly, so public displays show a rounded-down
// "orientation" figure (e.g. "12K+") rather than a false-precision exact
// number. Floors (never rounds up) so the "+" is always honest.
export function formatFollowers(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 1_000_000) return `${Math.floor(count / 1000)}K+`;
  return `${Math.floor(count / 100_000) / 10}M+`;
}

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Drives the "New" badge on Discover cards — a week feels long enough to
// actually be seen by someone browsing, short enough to still mean "new."
export function isRecentlyCreated(createdAt: number): boolean {
  return Date.now() - createdAt < NEW_WINDOW_MS;
}

// Same one-week window, for "is this still worth mentioning" — e.g. a
// released payment that may still be on its way to the creator's bank.
export function isWithinLastWeek(ms: number): boolean {
  return Date.now() - ms < NEW_WINDOW_MS;
}

// What server-rendered HTML formats times in, before the browser can report
// its own zone (see useViewerTimeZone). Every formatter below takes an
// explicit zone because the server runs in UTC — formatting there without
// one bakes UTC wall-clock times into the page.
export const DEFAULT_TIME_ZONE = "Europe/Berlin";

// Calendar day of `ms` on the viewer's own clock, as "YYYY-MM-DD" — built
// from parts rather than a locale's date string, whose field order isn't
// guaranteed to stay put across ICU versions.
export function dayKey(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ms);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function daysAgo(ms: number, timeZone: string): number {
  return Math.round((Date.parse(dayKey(Date.now(), timeZone)) - Date.parse(dayKey(ms, timeZone))) / 86_400_000);
}

export function formatMessageTime(ms: number, timeZone: string): string {
  return new Date(ms).toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
}

// A bare time (e.g. "12:59 PM") only reads as "just now" for something
// actually sent today — for anything older it would misleadingly look
// fresh, so this steps down to a weekday, then a full date, the way
// WhatsApp/Telegram inbox previews do.
export function formatMessageTimestamp(ms: number, timeZone: string): string {
  const diff = daysAgo(ms, timeZone);
  if (diff <= 0) return formatMessageTime(ms, timeZone);
  if (diff < 7) return new Date(ms).toLocaleDateString("en-US", { timeZone, weekday: "short" });
  return new Date(ms).toLocaleDateString("en-US", { timeZone });
}

// The divider between days inside a conversation.
export function formatDayLabel(ms: number, timeZone: string): string {
  const diff = daysAgo(ms, timeZone);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return new Date(ms).toLocaleDateString("en-US", { timeZone, weekday: "long" });
  return new Date(ms).toLocaleDateString("en-US", { timeZone, month: "short", day: "numeric", year: "numeric" });
}
