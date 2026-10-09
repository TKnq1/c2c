import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { parseUserAgent } from "@/lib/user-agent";

export type TimelineKind = "account" | "onboarding" | "request" | "collab" | "message" | "payment" | "report" | "login" | "moderation";
export type TimelineEvent = { at: Date; kind: TimelineKind; text: string };

const MAX_EVENTS = 80;

type ProfileSide = "brand" | "creator" | null;

export type TimelineInput = {
  side: ProfileSide;
  signedUp: Date;
  source: string | null;
  heardFrom: string | null;
  termsAcceptedAt: Date | null;
  marketingConsentAt: Date | null;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  onboarding: { step: string; kind: string; at: Date }[];
  requests: { title: string; at: Date }[];
  collabs: { title: string; counterpart: string; startedByThem: boolean; at: Date; acceptedAt: Date | null; paidAt: Date | null; amountCents: number | null; proofSubmittedAt: Date | null; disputedAt: Date | null; releasedAt: Date | null; refundedAt: Date | null }[];
  firstMessages: { title: string; at: Date; count: number }[];
  reportsMade: { reason: string; at: Date }[];
  reportsReceived: { reason: string; at: Date; automatic: boolean }[];
  logins: { at: Date; succeeded: boolean; userAgent: string | null }[];
};

const STEP_KIND: Record<string, string> = { completed: "abgeschlossen", skipped: "übersprungen", viewed: "angesehen" };

// What happened to an account, newest first, from tables that already exist. Pure: the loader hands in the rows.
export function buildTimeline(i: TimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const add = (at: Date | null, kind: TimelineKind, text: string) => {
    if (at) events.push({ at, kind, text });
  };

  add(i.signedUp, "account", `Konto angelegt${i.source ? ` (Quelle ${i.source})` : ""}${i.heardFrom ? `, gehört über: ${i.heardFrom}` : ""}`);
  add(i.termsAcceptedAt, "account", "AGB und Datenschutz akzeptiert");
  add(i.marketingConsentAt, "account", "Produkt-News bestätigt");
  for (const o of i.onboarding.filter((x) => x.kind !== "viewed")) add(o.at, "onboarding", `Onboarding-Schritt „${o.step}“ ${STEP_KIND[o.kind] ?? o.kind}`);
  for (const r of i.requests) add(r.at, "request", `Anfrage „${r.title}“ gepostet`);
  for (const c of i.collabs) {
    add(c.at, "collab", c.startedByThem ? `Gespräch mit ${c.counterpart} zu „${c.title}“ gestartet (von ${c.counterpart})` : `Gespräch mit ${c.counterpart} zu „${c.title}“ gestartet`);
    add(c.acceptedAt, "payment", `Angebot für „${c.title}“ angenommen${c.amountCents ? ` (${formatCents(c.amountCents)})` : ""}`);
    add(c.paidAt, "payment", `Zahlung für „${c.title}“ eingegangen${c.amountCents ? ` (${formatCents(c.amountCents)})` : ""}`);
    add(c.proofSubmittedAt, "payment", `Beitrag zu „${c.title}“ eingereicht`);
    add(c.disputedAt, "moderation", `Problem zu „${c.title}“ gemeldet, Zahlung eingefroren`);
    add(c.releasedAt, "payment", `Zahlung für „${c.title}“ ausgezahlt`);
    add(c.refundedAt, "payment", `Zahlung für „${c.title}“ erstattet`);
  }
  for (const m of i.firstMessages) add(m.at, "message", `Erste Nachricht zu „${m.title}“ (${m.count} insgesamt)`);
  for (const r of i.reportsMade) add(r.at, "report", `Hat selbst gemeldet: ${r.reason}`);
  for (const r of i.reportsReceived) add(r.at, "report", `${r.automatic ? "Automatisch gemeldet" : "Gemeldet"}: ${r.reason}`);
  for (const l of i.logins) add(l.at, "login", `${l.succeeded ? "Angemeldet" : "Fehlgeschlagene Anmeldung"} (${parseUserAgent(l.userAgent)})`);
  add(i.suspendedAt, "moderation", `Gesperrt${i.suspendedReason ? `: ${i.suspendedReason}` : ""}`);

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, MAX_EVENTS);
}

export async function loadTimeline(userId: string): Promise<TimelineEvent[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      utmSource: true,
      heardFrom: true,
      termsAcceptedAt: true,
      marketingConsentAt: true,
      suspendedAt: true,
      suspendedReason: true,
      startupProfile: { select: { id: true, companyName: true } },
      creatorProfile: { select: { id: true, displayName: true } },
      onboardingEvents: { select: { step: true, kind: true, createdAt: true } },
      reportsMade: { select: { reason: true, createdAt: true }, take: 20 },
      reportsReceived: { select: { reason: true, createdAt: true, reporterId: true }, take: 20 },
      loginAttempts: { orderBy: { createdAt: "desc" }, take: 10, select: { createdAt: true, succeeded: true, userAgent: true } },
    },
  });
  if (!user) return [];
  const brand = user.startupProfile;
  const creator = user.creatorProfile;
  const side = brand ? "brand" : creator ? "creator" : null;

  const interestSelect = {
    id: true,
    createdAt: true,
    initiatedBy: true,
    acceptedAt: true,
    paidAt: true,
    amountCents: true,
    proofSubmittedAt: true,
    disputedAt: true,
    releasedAt: true,
    refundedAt: true,
    creator: { select: { displayName: true } },
    request: { select: { title: true, startup: { select: { companyName: true } } } },
  } as const;
  const [requests, interests] = await Promise.all([
    brand ? prisma.request.findMany({ where: { startupId: brand.id, status: { not: "DRAFT" } }, select: { title: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 }) : [],
    brand
      ? prisma.interest.findMany({ where: { request: { startupId: brand.id } }, select: interestSelect, orderBy: { createdAt: "desc" }, take: 30 })
      : creator
        ? prisma.interest.findMany({ where: { creatorId: creator.id }, select: interestSelect, orderBy: { createdAt: "desc" }, take: 30 })
        : [],
  ]);
  const myRole = brand ? "STARTUP" : "CREATOR";
  const messages = interests.length
    ? await prisma.message.groupBy({ by: ["interestId"], where: { interestId: { in: interests.map((x) => x.id) }, senderRole: myRole }, _min: { createdAt: true }, _count: true })
    : [];
  const titleOf = new Map(interests.map((x) => [x.id, x.request.title]));

  return buildTimeline({
    side,
    signedUp: user.createdAt,
    source: user.utmSource,
    heardFrom: user.heardFrom,
    termsAcceptedAt: user.termsAcceptedAt,
    marketingConsentAt: user.marketingConsentAt,
    suspendedAt: user.suspendedAt,
    suspendedReason: user.suspendedReason,
    onboarding: user.onboardingEvents.map((o) => ({ step: o.step, kind: o.kind, at: o.createdAt })),
    requests: requests.map((r) => ({ title: r.title, at: r.createdAt })),
    collabs: interests.map((x) => ({
      title: x.request.title,
      counterpart: brand ? x.creator.displayName : x.request.startup.companyName,
      startedByThem: brand ? x.initiatedBy === "CREATOR" : x.initiatedBy === "STARTUP",
      at: x.createdAt,
      acceptedAt: x.acceptedAt,
      paidAt: x.paidAt,
      amountCents: x.amountCents,
      proofSubmittedAt: x.proofSubmittedAt,
      disputedAt: x.disputedAt,
      releasedAt: x.releasedAt,
      refundedAt: x.refundedAt,
    })),
    firstMessages: messages.flatMap((m) => (m._min.createdAt ? [{ title: titleOf.get(m.interestId) ?? "", at: m._min.createdAt, count: m._count }] : [])),
    reportsMade: user.reportsMade.map((r) => ({ reason: r.reason, at: r.createdAt })),
    reportsReceived: user.reportsReceived.map((r) => ({ reason: r.reason, at: r.createdAt, automatic: r.reporterId === null })),
    logins: user.loginAttempts.map((l) => ({ at: l.createdAt, succeeded: l.succeeded, userAgent: l.userAgent })),
  });
}
