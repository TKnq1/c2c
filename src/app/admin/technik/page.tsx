import { FiAlertTriangle, FiCheckCircle, FiExternalLink } from "react-icons/fi";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { readSnapshots, sentryConfigured } from "@/lib/admin-external";
import { RefreshButton } from "@/components/admin/tech-controls";
import { DashCard, DataTable, KpiTile, PageHeader } from "@/components/admin/dashboard-parts";
import { LocalDate } from "@/components/local-date";

export const metadata = { title: "Technik" };

const DAY = 24 * 60 * 60 * 1000;

function Notice({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? FiCheckCircle : FiAlertTriangle;
  return (
    <p className="flex items-start gap-2 text-sm">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ok ? "text-[#0ca30c]" : "text-[#d03b3b]"}`} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export default async function AdminTechPage() {
  await requireAdminSession();
  const now = new Date();
  const [snapshots, mailFailures] = await Promise.all([
    readSnapshots(),
    prisma.mailLog.findMany({ where: { ok: false, createdAt: { gte: new Date(now.getTime() - DAY) } }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, subject: true, error: true, createdAt: true } }),
  ]);
  const sentry = snapshots.sentry?.data;
  const stripe = snapshots.stripe?.data;
  const stripeOn = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const sentryOn = sentryConfigured();
  const sentryCount = sentry?.ok ? sentry.total : null;
  const stripeCount = stripe?.ok ? stripe.total : null;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Technik"
        sub="Läuft alles? Fehler aus der App, Stripe-Meldungen, die nicht angekommen sind, und Mails, die nicht rausgingen. Die Antworten von Sentry und Stripe werden alle paar Minuten im Hintergrund geholt."
        right={<RefreshButton />}
      />

      <div className="grid gap-[var(--gap,1rem)] sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Offene Fehler (24 Std.)" value={sentryCount === null ? "–" : sentryCount >= 10 ? "10+" : String(sentryCount)} hint={sentryOn ? "Ungelöste Sentry-Meldungen" : "Sentry-Lesezugriff nicht eingerichtet"} />
        <KpiTile label="Stripe-Meldungen nicht angekommen" value={stripeCount === null ? "–" : String(stripeCount)} hint={stripeOn ? "Webhooks der letzten 24 Std., die gescheitert sind" : "Stripe nicht verbunden"} />
        <KpiTile label="Mails fehlgeschlagen (24 Std.)" value={String(mailFailures.length >= 5 ? "5+" : mailFailures.length)} hint="Aus dem eigenen Sendeprotokoll" href="/admin/mails" />
        <KpiTile label="Stand der App" value={commit ?? "lokal"} hint={process.env.VERCEL_ENV ? `Umgebung: ${process.env.VERCEL_ENV}` : "Nicht auf Vercel"} />
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Fehler in der App (Sentry)" right={snapshots.sentry ? <LocalDate ms={snapshots.sentry.fetchedAt.getTime()} locale="de-DE" withTime /> : undefined}>
          {!sentryOn ? (
            <p className="text-sm">
              Noch nicht eingerichtet. Lege in Vercel <b>SENTRY_AUTH_TOKEN</b> (Token mit reinem Lesezugriff), <b>SENTRY_ORG</b> und <b>SENTRY_PROJECT</b> an, dazu braucht es den bestehenden <b>NEXT_PUBLIC_SENTRY_DSN</b>.
            </p>
          ) : !sentry ? (
            <p className="text-sm text-neutral-500">Noch nicht abgefragt. Das passiert beim nächsten Seitenaufruf oder jetzt über „Jetzt abfragen“.</p>
          ) : !sentry.ok ? (
            <Notice ok={false}>{sentry.error}</Notice>
          ) : sentry.issues.length === 0 ? (
            <Notice ok>Keine ungelösten Fehler in den letzten 24 Stunden.</Notice>
          ) : (
            <DataTable head={[{ label: "Fehler" }, { label: "Anzahl", right: true }, { label: "Nutzer", right: true, hideSmall: true }]}>
              {sentry.issues.map((i) => (
                <tr key={i.id}>
                  <td>
                    {i.link ? (
                      <a href={i.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 font-bold underline-offset-2 hover:underline">
                        {i.title}
                        <FiExternalLink className="mt-1 h-3 w-3 shrink-0" aria-hidden />
                      </a>
                    ) : (
                      <span className="font-bold">{i.title}</span>
                    )}
                    {i.culprit && <span className="block text-xs break-all text-neutral-500">{i.culprit}</span>}
                  </td>
                  <td className="text-right tabular-nums">{i.count.toLocaleString("de-DE")}</td>
                  <td className="text-right tabular-nums">{i.users}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </DashCard>

        <DashCard title="Stripe-Webhooks" right={snapshots.stripe ? <LocalDate ms={snapshots.stripe.fetchedAt.getTime()} locale="de-DE" withTime /> : undefined}>
          {!stripeOn ? (
            <p className="text-sm">Stripe ist nicht verbunden (STRIPE_SECRET_KEY fehlt).</p>
          ) : !stripe ? (
            <p className="text-sm text-neutral-500">Noch nicht abgefragt. Das passiert beim nächsten Seitenaufruf oder jetzt über „Jetzt abfragen“.</p>
          ) : !stripe.ok ? (
            <Notice ok={false}>{stripe.error}</Notice>
          ) : stripe.failed.length === 0 ? (
            <Notice ok>Alle Meldungen der letzten 24 Stunden sind angekommen.</Notice>
          ) : (
            <>
              <Notice ok={false}>
                {stripe.failed.length} Meldungen konnten nicht zugestellt werden. Bei Zahlungen heißt das: das Geld ist da, die App weiß es vielleicht noch nicht.
              </Notice>
              <div className="mt-3">
                <DataTable head={[{ label: "Ereignis" }, { label: "Zeit", right: true }]}>
                  {stripe.failed.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <a href={`https://dashboard.stripe.com/events/${encodeURIComponent(e.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold underline-offset-2 hover:underline">
                          {e.type}
                          <FiExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      </td>
                      <td className="text-right text-neutral-600 dark:text-neutral-400">
                        <LocalDate ms={new Date(e.at).getTime()} locale="de-DE" withTime />
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
              <p className="mt-3 text-xs text-neutral-500">In Stripe unter Entwickler, Webhooks, lässt sich eine Meldung erneut senden.</p>
            </>
          )}
        </DashCard>
      </div>

      <DashCard title="Mails, die nicht rausgingen" right="letzte 24 Stunden">
        {mailFailures.length === 0 ? (
          <Notice ok>Keine fehlgeschlagene Mail in den letzten 24 Stunden.</Notice>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {mailFailures.map((f) => (
              <li key={f.id}>
                <p className="flex flex-wrap justify-between gap-x-3">
                  <b>{f.subject}</b>
                  <span className="text-xs text-neutral-500">
                    <LocalDate ms={f.createdAt.getTime()} locale="de-DE" withTime />
                  </span>
                </p>
                <p className="text-xs break-words text-neutral-600 dark:text-neutral-400">{f.error}</p>
              </li>
            ))}
          </ul>
        )}
      </DashCard>
    </div>
  );
}
