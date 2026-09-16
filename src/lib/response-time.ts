import type { Role } from "@prisma/client";

type MessageLike = { senderRole: Role; createdAt: Date };

/**
 * Median time from an incoming message to this party's next reply, across
 * every conversation they're in. Each `conversations` entry is one
 * conversation's messages, oldest first. Consecutive messages from the same
 * side only count once — from the first unanswered message to the reply —
 * so a burst of messages doesn't get measured multiple times.
 */
export function computeResponseTimeMs(conversations: MessageLike[][], myRole: Role): number | null {
  const gaps: number[] = [];

  for (const messages of conversations) {
    let waitingSince: number | null = null;
    for (const m of messages) {
      if (m.senderRole === myRole) {
        if (waitingSince !== null) {
          gaps.push(m.createdAt.getTime() - waitingSince);
          waitingSince = null;
        }
      } else if (waitingSince === null) {
        waitingSince = m.createdAt.getTime();
      }
    }
  }

  if (gaps.length === 0) return null;
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  return gaps.length % 2 === 0 ? (gaps[mid - 1] + gaps[mid]) / 2 : gaps[mid];
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** eBay/Vinted-style bucketed label. Null when there's no response history yet. */
export function formatResponseTime(ms: number | null): string | null {
  if (ms === null) return null;
  if (ms < 30 * MINUTE) return "Usually responds within minutes";
  if (ms < HOUR) return "Usually responds within an hour";
  if (ms < 6 * HOUR) return "Usually responds within a few hours";
  if (ms < DAY) return "Usually responds within a day";
  if (ms < 3 * DAY) return "Usually responds within a few days";
  return "Response time varies";
}
