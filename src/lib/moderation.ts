import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";

// True if either side has blocked the other — blocking is meant to cut off
// contact in both directions, not just from the blocker's side.
export async function isBlocked(userIdA: string, userIdB: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  return !!block;
}

// Direction matters here, unlike isBlocked: only the blocker can lift a
// block, so this is what decides whether to offer "Unblock".
export async function hasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  return !!block;
}

// All user ids that should be hidden from `viewerId` — everyone they've
// blocked, and everyone who's blocked them.
export async function getMutualBlockedUserIds(viewerId: string): Promise<string[]> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) {
    ids.add(b.blockerId === viewerId ? b.blockedId : b.blockerId);
  }
  return [...ids];
}

// Simple, transparent rule-based checks — not ML, just the same kind of
// pattern/volume heuristics most platforms start with before investing in
// anything smarter. False positives just mean an extra item in the human
// review queue below, not an automatic ban, so erring on the loose side is
// the safer failure mode.
const SUSPICIOUS_TEXT_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\b(wire transfer|western union|gift cards?|send (?:bitcoin|crypto)|whatsapp me|telegram me)\b/i,
    reason: "Possible scam language",
  },
  { pattern: /(https?:\/\/\S+){3,}/i, reason: "Multiple links in one message" },
];

export function detectSuspiciousText(text: string): string | null {
  for (const { pattern, reason } of SUSPICIOUS_TEXT_PATTERNS) {
    if (pattern.test(text)) return reason;
  }
  return null;
}

// Files a system report (no human filer) so automated flags land in the
// exact same admin review queue as user-filed ones, instead of a separate
// log nobody looks at.
export async function flagForReview(reportedId: string, reason: string, details: string) {
  await prisma.report.create({
    data: { reportedId, reason: `Automated: ${reason}`, details: details.slice(0, 1000), reporterId: null },
  });
}

const MESSAGE_BURST_WINDOW_MINUTES = 2;
const MESSAGE_BURST_THRESHOLD = 8;

// A burst of messages from the same side of one conversation in a short
// window is a real (if simple) bot/spam signal on its own, independent of
// what the messages actually say.
export async function flagIfMessageBurst(interestId: string, senderRole: Role, reportedId: string) {
  const since = new Date(Date.now() - MESSAGE_BURST_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.message.count({ where: { interestId, senderRole, createdAt: { gte: since } } });
  if (recentCount >= MESSAGE_BURST_THRESHOLD) {
    await flagForReview(
      reportedId,
      "Message burst",
      `${recentCount} messages within ${MESSAGE_BURST_WINDOW_MINUTES} minutes in one conversation`,
    );
  }
}

const NEW_ACCOUNT_HOURS = 24;
const LARGE_OFFER_CENTS = 100_000; // $1,000 — with real money nothing here is fraud-proof, but a
// brand-new account immediately proposing an unusually large payment is
// exactly the kind of pattern scam/throwaway accounts show.
export async function flagIfAnomalousOffer(userCreatedAt: Date, amountCents: number, reportedId: string) {
  const accountAgeHours = (Date.now() - userCreatedAt.getTime()) / (60 * 60 * 1000);
  if (accountAgeHours < NEW_ACCOUNT_HOURS && amountCents >= LARGE_OFFER_CENTS) {
    await flagForReview(
      reportedId,
      "Large offer from new account",
      `${formatCents(amountCents)} offered ${accountAgeHours.toFixed(1)}h after account creation`,
    );
  }
}
