import { prisma } from "@/lib/prisma";
import type { CheckResult } from "@/lib/admin-tasks";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// What waits on the admin among the brand deals and does not resolve by itself. Each check closes itself as soon as the
// cause is gone (see planCheckSync in admin-tasks.ts), so none of this needs to be ticked off. Things the daily job is still
// working on only show up after a day.
export async function dealChecks(now: Date): Promise<CheckResult[]> {
  const hourAgo = new Date(now.getTime() - HOUR);
  const dayAgo = new Date(now.getTime() - DAY);
  const twoDaysAgo = new Date(now.getTime() - 2 * DAY);

  const [disputes, payoutsWaiting, payoutsUnrecorded, invoicesMissing, vatUnconfirmed] = await Promise.all([
    prisma.dealDispute.count({ where: { status: "OPEN" } }),
    // Due for a day and the money still with the platform: the creator's Stripe account is not ready, or Stripe keeps saying no.
    prisma.deal.count({ where: { status: "PAYOUT_PENDING", statusChangedAt: { lte: dayAgo }, interest: { paymentStatus: "HELD" } } }),
    // The transfer left without a clear answer and Stripe has not confirmed it (see releaseDealPayout). Not within the first hour:
    // a transfer that is just being made looks the same for a moment.
    prisma.deal.count({ where: { status: "PAYOUT_PENDING", interest: { paymentStatus: "RELEASED", stripeTransferId: null, releasedAt: { lte: hourAgo } } } }),
    prisma.deal.count({
      where: {
        status: "COMPLETED",
        completedAt: { lte: dayAgo },
        OR: [{ invoices: { none: { kind: "BRAND_INVOICE" } } }, { invoices: { none: { kind: "CREATOR_CREDIT_NOTE" } } }],
      },
    }),
    prisma.businessProfile.count({ where: { vatId: { not: null }, vatIdStatus: { in: ["INVALID", "UNAVAILABLE"] }, updatedAt: { lte: twoDaysAgo } } }),
  ]);

  const checks: CheckResult[] = [];
  if (disputes > 0) {
    checks.push({
      key: "deal-disputes-open",
      title: `${plural(disputes, "Deal im Streit", "Deals im Streit")}`,
      reason: "Der Deal und das Geld sind eingefroren, bis du entscheidest",
      priority: "HIGH",
      href: "/admin/deals",
    });
  }
  if (payoutsUnrecorded > 0) {
    checks.push({
      key: "deal-transfer-unrecorded",
      title: `${plural(payoutsUnrecorded, "Auszahlung", "Auszahlungen")} ohne Stripe-Bestätigung`,
      reason: "Die Überweisung ist ohne klare Antwort abgebrochen: in Stripe nachsehen, bevor der Deal weiterläuft",
      priority: "HIGH",
      href: "/admin/deals",
    });
  }
  if (payoutsWaiting > 0) {
    checks.push({
      key: "deal-payouts-stuck",
      title: `${plural(payoutsWaiting, "Auszahlung hängt", "Auszahlungen hängen")} seit über einem Tag`,
      reason: "Der Creator hat die Auszahlung nicht eingerichtet, oder Stripe lehnt die Überweisung ab",
      priority: "MEDIUM",
      href: "/admin/deals",
    });
  }
  if (invoicesMissing > 0) {
    checks.push({
      key: "deal-invoices-missing",
      title: `${plural(invoicesMissing, "abgeschlossener Deal hat", "abgeschlossene Deals haben")} keine vollständigen Rechnungen`,
      reason: "Meist fehlen die Steuerdaten von comtor oder eine USt-ID: dann lassen sich die Rechnungen nicht ausstellen",
      priority: "MEDIUM",
      href: "/admin/deals",
    });
  }
  if (vatUnconfirmed > 0) {
    checks.push({
      key: "deal-vat-unconfirmed",
      title: `${plural(vatUnconfirmed, "USt-ID", "USt-IDs")} von VIES nicht bestätigt`,
      reason: "Erneut prüfen lassen oder beim Nutzer nachfragen: ohne bestätigte USt-ID gibt es keine Rechnung ohne Umsatzsteuer",
      priority: "LOW",
      href: "/admin/deals",
    });
  }
  return checks;
}
