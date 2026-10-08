import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { formatCents } from "@/lib/format";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { LocalDate } from "@/components/local-date";
import { DealDisputeResolver } from "@/components/admin/deal-dispute-resolver";
import { issueDealInvoicesAction, recheckVatIdAction } from "@/lib/actions/deal-admin";
import { disputeReasonText } from "@/lib/deals/payout";
import { parseTerms } from "@/lib/deals/terms";
import { POST_FORMATS, isPostFormat } from "@/lib/social/platforms";
import { platformIssuer } from "@/lib/billing/issuer";

const STATUS_DE: Record<string, string> = {
  CONTRACT_PENDING: "Vertrag offen",
  AWAITING_ESCROW: "Zahlung offen",
  IN_PRODUCTION: "In Arbeit",
  DRAFT_SUBMITTED: "Entwurf in Prüfung",
  CHANGES_REQUESTED: "Änderungen gewünscht",
  DRAFT_APPROVED: "Entwurf freigegeben",
  POST_SCHEDULED: "Post geplant",
  POST_SUBMITTED: "Post wird geprüft",
  VERIFYING: "Online, Haltefrist",
  REPOST_REQUIRED: "Post entfernt",
  PAYOUT_PENDING: "Auszahlung fällig",
  COMPLETED: "Abgeschlossen",
  DISPUTED: "Eingefroren",
  CANCELLED: "Abgebrochen",
};

const dealParties = {
  interest: {
    select: {
      id: true,
      payoutCents: true,
      request: { select: { title: true, startup: { select: { userId: true, companyName: true, user: { select: { email: true } } } } } },
      creator: { select: { userId: true, displayName: true, stripeOnboarded: true, user: { select: { email: true } } } },
    },
  },
} as const;

export default async function AdminDealsPage() {
  await requireAdminSession();

  const [disputes, stuck, withoutInvoices, recent, vatProblems, counts] = await Promise.all([
    prisma.dealDispute.findMany({
      where: { status: "OPEN" },
      orderBy: { openedAt: "asc" },
      include: {
        deal: {
          include: {
            ...dealParties,
            posts: { select: { id: true, format: true, url: true, status: true, caption: true, proofs: { select: { id: true } } } },
            drafts: { orderBy: { version: "desc" }, take: 1, select: { url: true, status: true, feedback: true } },
          },
        },
      },
    }),
    prisma.deal.findMany({ where: { status: "PAYOUT_PENDING" }, orderBy: { statusChangedAt: "asc" }, include: dealParties }),
    prisma.deal.findMany({
      where: { status: "COMPLETED", OR: [{ invoices: { none: { kind: "BRAND_INVOICE" } } }, { invoices: { none: { kind: "CREATOR_CREDIT_NOTE" } } }] },
      orderBy: { completedAt: "asc" },
      include: dealParties,
      take: 50,
    }),
    prisma.deal.findMany({ orderBy: { statusChangedAt: "desc" }, take: 40, include: dealParties }),
    prisma.businessProfile.findMany({
      where: { vatId: { not: null }, vatIdStatus: { in: ["INVALID", "UNAVAILABLE"] } },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { userId: true, legalName: true, vatId: true, vatIdStatus: true, vatIdCheckedAt: true, country: true },
    }),
    prisma.deal.groupBy({ by: ["status"], _count: true }),
  ]);
  const issuerReady = platformIssuer() !== null;
  const active = counts.filter((c) => !["COMPLETED", "CANCELLED"].includes(c.status)).reduce((sum, c) => sum + c._count, 0);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-title-1 font-bold">Brand Deals</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Streitfälle, hängende Auszahlungen, fehlende Rechnungen und USt-ID-Prüfungen. {active} Deals laufen gerade.
        </p>
      </div>

      {!issuerReady && (
        <p className="rounded border border-dashed border-ink px-4 py-3 text-sm">
          Die Steuerdaten von comtor fehlen: Setze <code>IMPRINT_VAT_ID</code> oder <code>PLATFORM_TAX_NUMBER</code> in Vercel. Ohne sie werden keine Rechnungen
          ausgestellt.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-semibold">Offene Streitfälle ({disputes.length})</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Der Deal und das Geld sind eingefroren, ältester zuerst. Sieh dir Entwurf, Post und Nachweis an, schreibe beiden Seiten und entscheide dann.
          </p>
        </div>
        {disputes.length === 0 ? (
          <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">Nichts zu entscheiden.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {disputes.map((d) => {
              const { deal } = d;
              const terms = parseTerms(deal.terms);
              const brand = deal.interest.request.startup;
              const creator = deal.interest.creator;
              return (
                <li key={d.id} className="flex flex-col gap-2 rounded border border-dashed border-ink px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm">
                      <Link href={`/admin/users/${brand.userId}`} className="font-medium hover:underline">
                        {brand.companyName}
                      </Link>
                      {" → "}
                      <Link href={`/admin/users/${creator.userId}`} className="font-medium hover:underline">
                        {creator.displayName}
                      </Link>
                      {` · ${deal.interest.request.title}`}
                    </p>
                    <span className="shrink-0 text-sm font-medium tabular-nums">{formatCents(deal.brandTotalCents ?? terms.amountCents)}</span>
                  </div>
                  <p className="text-sm font-medium">
                    {disputeReasonText(d.reason, "de")}
                    <span className="font-normal text-neutral-500 dark:text-neutral-400">
                      {" "}
                      · eröffnet von {d.openedByRole === "STARTUP" ? "der Marke" : d.openedByRole === "CREATOR" ? "dem Creator" : "dem System"}, davor: {deal.statusBeforeDispute ? STATUS_DE[deal.statusBeforeDispute] : "–"}
                    </span>
                  </p>
                  {d.details && <p className="text-sm text-neutral-700 dark:text-neutral-300">“{d.details}”</p>}
                  <ul className="flex flex-col gap-0.5 text-footnote text-neutral-500 dark:text-neutral-400">
                    {deal.drafts[0] && (
                      <li>
                        Letzter Entwurf ({deal.drafts[0].status}):{" "}
                        {deal.drafts[0].url ? (
                          <a href={deal.drafts[0].url} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                            ansehen
                          </a>
                        ) : (
                          "nur Notizen"
                        )}
                        {deal.drafts[0].feedback ? ` · Feedback: „${deal.drafts[0].feedback}“` : ""}
                      </li>
                    )}
                    {deal.posts.map((p) => (
                      <li key={p.id}>
                        {isPostFormat(p.format) ? POST_FORMATS[p.format].label : p.format} ({p.status}):{" "}
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                            Post öffnen
                          </a>
                        ) : (
                          "kein Link"
                        )}
                        {p.proofs.map((proof) => (
                          <span key={proof.id}>
                            {" · "}
                            <a href={`/api/deals/${deal.id}/proofs/${proof.id}`} target="_blank" rel="noopener noreferrer" className="underline">
                              Nachweis
                            </a>
                          </span>
                        ))}
                      </li>
                    ))}
                    <li>
                      Marke: {brand.user.email} · Creator: {creator.user.email} · eröffnet <LocalDate ms={d.openedAt.getTime()} />
                    </li>
                  </ul>
                  <DealDisputeResolver
                    disputeId={d.id}
                    amountCents={deal.brandTotalCents ?? terms.amountCents}
                    payoutCents={deal.interest.payoutCents ?? terms.payoutCents}
                    brandName={brand.companyName}
                    creatorName={creator.displayName}
                    canResume={deal.statusBeforeDispute !== null}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Auszahlung fällig, aber nicht durch ({stuck.length})</h2>
        {stuck.length === 0 ? (
          <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">Nichts hängt.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {stuck.map((deal) => (
              <li key={deal.id} className="rounded bg-fog px-4 py-3 text-sm">
                <span className="font-medium">{deal.interest.request.title}</span> · {deal.interest.creator.displayName}
                {deal.interest.creator.stripeOnboarded ? " (Stripe-Konto bereit, der tägliche Lauf versucht es erneut)" : " – hat die Auszahlung noch nicht eingerichtet"} · seit{" "}
                <LocalDate ms={deal.statusChangedAt.getTime()} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Abgeschlossen ohne vollständige Rechnungen ({withoutInvoices.length})</h2>
        {withoutInvoices.length === 0 ? (
          <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">Alles abgerechnet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {withoutInvoices.map((deal) => (
              <li key={deal.id} className="flex flex-wrap items-center justify-between gap-3 rounded bg-fog px-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{deal.interest.request.title}</span> · {deal.interest.request.startup.companyName} → {deal.interest.creator.displayName}
                </span>
                <ConfirmActionButton
                  action={(password) => issueDealInvoicesAction(deal.id, password)}
                  requirePassword
                  successMessage="Rechnungen erstellt."
                  title="Rechnungen erstellen?"
                  description="Die Rechnung an die Marke und die Gutschrift für den Creator werden mit der nächsten Nummer ausgestellt."
                  confirmLabel="Erstellen"
                  pendingLabel="Erstelle…"
                  className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper transition hover:bg-graphite"
                >
                  Rechnungen erstellen
                </ConfirmActionButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">USt-IDs, die VIES nicht bestätigt hat ({vatProblems.length})</h2>
        {vatProblems.length === 0 ? (
          <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">Keine auffälligen USt-IDs.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {vatProblems.map((p) => (
              <li key={p.userId} className="flex flex-wrap items-center justify-between gap-3 rounded bg-fog px-4 py-3 text-sm">
                <span>
                  <Link href={`/admin/users/${p.userId}`} className="font-medium hover:underline">
                    {p.legalName}
                  </Link>{" "}
                  · {p.vatId} ({p.country}) · {p.vatIdStatus === "INVALID" ? "von VIES abgelehnt" : "VIES nicht erreichbar"}
                </span>
                <ConfirmActionButton
                  action={async () => recheckVatIdAction(p.userId)}
                  successMessage="USt-ID bestätigt."
                  title="USt-ID erneut prüfen?"
                  description="VIES wird noch einmal gefragt. Bei einer Bestätigung kann der Nutzer Deals ohne Umsatzsteuer abschließen."
                  confirmLabel="Prüfen"
                  pendingLabel="Prüfe…"
                  className="rounded-full border border-ink px-4 py-1.5 text-sm font-medium transition hover:bg-fog"
                >
                  Erneut prüfen
                </ConfirmActionButton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Letzte Deals</h2>
        <ul className="flex flex-col gap-1">
          {recent.map((deal) => (
            <li key={deal.id} className="flex flex-wrap items-baseline justify-between gap-3 rounded bg-fog px-4 py-2 text-sm">
              <span className="min-w-0">
                <span className="font-medium">{deal.interest.request.title}</span> · {deal.interest.request.startup.companyName} → {deal.interest.creator.displayName}
              </span>
              <span className="shrink-0 text-footnote text-neutral-500 dark:text-neutral-400">
                {STATUS_DE[deal.status]} · {formatCents(deal.brandTotalCents ?? 0)} · <LocalDate ms={deal.statusChangedAt.getTime()} />
              </span>
            </li>
          ))}
          {recent.length === 0 && <li className="rounded bg-fog px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">Noch keine Deals.</li>}
        </ul>
      </section>
    </div>
  );
}
