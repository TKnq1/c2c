import type { DealStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { transition, type Actor, type DealAction, type TransitionContext } from "@/lib/deals/status";
import { parseTerms, type DealTerms } from "@/lib/deals/terms";

export const dealInclude = {
  interest: { include: { request: { include: { startup: true, briefing: true } }, creator: true } },
} satisfies Prisma.DealInclude;

export type DealWithParties = Prisma.DealGetPayload<{ include: typeof dealInclude }>;

export type DealView = {
  deal: DealWithParties;
  terms: DealTerms;
  title: string;
  brandUserId: string;
  brandName: string;
  creatorUserId: string;
  creatorName: string;
};

export function describeDeal(deal: DealWithParties): DealView {
  const { interest } = deal;
  return {
    deal,
    terms: parseTerms(deal.terms),
    title: interest.request.title,
    brandUserId: interest.request.startup.userId,
    brandName: interest.request.startup.companyName,
    creatorUserId: interest.creator.userId,
    creatorName: interest.creator.displayName,
  };
}

export async function loadDeal(dealId: string): Promise<DealView | null> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: dealInclude });
  return deal ? describeDeal(deal) : null;
}

// The deal, if this user is one of its two parties.
export async function loadDealForParty(dealId: string, userId: string, role: Role): Promise<DealView | null> {
  const view = await loadDeal(dealId);
  if (!view) return null;
  if (role === "STARTUP" && view.brandUserId === userId) return view;
  if (role === "CREATOR" && view.creatorUserId === userId) return view;
  return null;
}

export function partyRole(view: DealView, userId: string): "STARTUP" | "CREATOR" | null {
  if (view.brandUserId === userId) return "STARTUP";
  if (view.creatorUserId === userId) return "CREATOR";
  return null;
}

export function otherPartyUserId(view: DealView, role: "STARTUP" | "CREATOR"): string {
  return role === "STARTUP" ? view.creatorUserId : view.brandUserId;
}

export function actorToRole(actor: Actor): Role | null {
  return actor === "SYSTEM" ? null : actor;
}

type EventOptions = {
  fromStatus?: DealStatus | null;
  toStatus?: DealStatus | null;
  actor?: Actor;
  actorUserId?: string | null;
  data?: Prisma.InputJsonValue;
};

export function recordDealEvent(db: Prisma.TransactionClient, dealId: string, kind: string, options: EventOptions = {}) {
  return db.dealEvent.create({
    data: {
      dealId,
      kind,
      fromStatus: options.fromStatus ?? null,
      toStatus: options.toStatus ?? null,
      actorRole: options.actor ? actorToRole(options.actor) : null,
      actorUserId: options.actorUserId ?? null,
      data: options.data,
    },
  });
}

export type MoveOptions = {
  actorUserId?: string | null;
  ctx?: TransitionContext;
  // Written together with the new status, in the same update.
  data?: Prisma.DealUncheckedUpdateManyInput;
  event?: string;
  eventData?: Prisma.InputJsonValue;
  // The status the caller based its decision on: if the deal has moved since, nothing happens.
  expectedFrom?: DealStatus;
};

export type MoveResult =
  | { ok: true; from: DealStatus; to: DealStatus }
  | { ok: false; reason: "NOT_FOUND" | "NOT_ALLOWED" | "ACTOR" | "RESUME" | "CONFLICT" };

// The one way a deal changes status: the table in status.ts decides if it may, the update only goes through while the
// deal is still where the decision was made (two taps, a tap and the daily job, cannot both win), and the step is
// written to the deal's trail.
export async function moveDeal(dealId: string, action: DealAction, actor: Actor, options: MoveOptions = {}): Promise<MoveResult> {
  const current = await prisma.deal.findUnique({ where: { id: dealId }, select: { status: true, statusBeforeDispute: true } });
  if (!current) return { ok: false, reason: "NOT_FOUND" };
  if (options.expectedFrom && current.status !== options.expectedFrom) return { ok: false, reason: "CONFLICT" };

  const result = transition(current.status, action, actor, {
    ...options.ctx,
    resumeTo: options.ctx?.resumeTo ?? current.statusBeforeDispute,
  });
  if (!result.ok) {
    return { ok: false, reason: result.reason === "ACTOR_NOT_ALLOWED" ? "ACTOR" : result.reason === "RESUME_TARGET_REQUIRED" ? "RESUME" : "NOT_ALLOWED" };
  }

  const to = result.to;
  const changed = to !== current.status;
  const data: Prisma.DealUncheckedUpdateManyInput = {
    ...options.data,
    status: to,
    ...(changed ? { statusChangedAt: new Date() } : {}),
    ...(to === "DISPUTED" ? { statusBeforeDispute: current.status } : current.status === "DISPUTED" ? { statusBeforeDispute: null } : {}),
  };

  const applied = await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.updateMany({ where: { id: dealId, status: current.status }, data });
    if (updated.count !== 1) return false;
    await recordDealEvent(tx, dealId, options.event ?? (changed ? `status.${to}` : `action.${action}`), {
      fromStatus: current.status,
      toStatus: to,
      actor,
      actorUserId: options.actorUserId,
      data: options.eventData,
    });
    return true;
  });
  if (!applied) return { ok: false, reason: "CONFLICT" };
  return { ok: true, from: current.status, to };
}

// A refusal as a sentence, for the places that have no better one.
export function moveFailureMessage(reason: Extract<MoveResult, { ok: false }>["reason"], locale: "de" | "en"): string {
  const texts = {
    NOT_FOUND: { en: "This deal could not be found.", de: "Dieser Deal wurde nicht gefunden." },
    NOT_ALLOWED: { en: "That isn't possible at this stage of the deal.", de: "Das ist in dieser Phase des Deals nicht möglich." },
    ACTOR: { en: "You can't do that on this deal.", de: "Das kannst du bei diesem Deal nicht tun." },
    RESUME: { en: "Choose a stage to resume at.", de: "Wähle eine Phase, in der es weitergeht." },
    CONFLICT: { en: "The deal changed in the meantime. Reload the page.", de: "Der Deal hat sich zwischenzeitlich geändert. Lade die Seite neu." },
  } as const;
  return texts[reason][locale];
}

// Marks a reminder as sent and says whether this call was the one that did: of two overlapping runs, only one gets to
// send it.
export async function claimReminder(dealId: string, key: string): Promise<boolean> {
  const claimed = await prisma.deal.updateMany({
    where: { id: dealId, NOT: { remindersSent: { has: key } } },
    data: { remindersSent: { push: key } },
  });
  return claimed.count === 1;
}
