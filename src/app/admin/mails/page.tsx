import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { requireAdminSession } from "@/lib/admin-session";
import { loadMails } from "@/lib/admin-mails";
import { DailyBarChart } from "@/components/admin/daily-bar-chart";
import { DashCard, DataTable, KpiTile, PageHeader, Stat } from "@/components/admin/dashboard-parts";
import { LocalDate } from "@/components/local-date";

export const metadata = { title: "Mails" };

export default async function AdminMailsPage() {
  await requireAdminSession();
  const m = await loadMails();
  const total = (points: { value: number }[]) => points.reduce((sum, p) => sum + p.value, 0);
  const o = m.outreach;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mails"
        sub={`Was die App in den letzten ${m.days} Tagen verschickt hat und ob der Mail-Dienst es angenommen hat. Gespeichert werden nur Betreff und Ergebnis, nie die Adresse.`}
      />

      <div className="grid gap-[var(--gap,1rem)] sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Verschickt" value={m.sent.toLocaleString("de-DE")} hint={m.loggedSince ? undefined : "Das Protokoll beginnt mit der ersten Mail nach diesem Update"} />
        <KpiTile label="Fehlgeschlagen" value={m.failed.toLocaleString("de-DE")} hint={m.failureRate === null ? "Noch keine Mails protokolliert" : `${m.failureRate} % aller Versuche`} />
        <KpiTile label="Warteliste bestätigt" value={`${m.waitlist.confirmed} von ${m.waitlist.total}`} hint={`${m.waitlist.pending} warten auf die Bestätigung`} />
        <KpiTile label="Produkt-News erlaubt" value={m.newsletterUsers.toLocaleString("de-DE")} hint="Nutzer mit bestätigter Einwilligung" />
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DailyBarChart title="Verschickte Mails pro Tag" points={m.sentByDay} unit="count" total={`${total(m.sentByDay).toLocaleString("de-DE")} in ${m.days} Tagen`} />
        <DailyBarChart title="Fehlgeschlagene Mails pro Tag" points={m.failedByDay} unit="count" total={`${total(m.failedByDay).toLocaleString("de-DE")} in ${m.days} Tagen`} />
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Nach Betreff">
          {m.subjects.length === 0 ? (
            <p className="text-sm text-neutral-500">Noch keine Mails protokolliert.</p>
          ) : (
            <DataTable head={[{ label: "Betreff" }, { label: "Anzahl", right: true }, { label: "Fehler", right: true }]}>
              {m.subjects.map((s) => (
                <tr key={s.subject}>
                  <td className="font-bold">{s.subject}</td>
                  <td className="text-right tabular-nums">{s.count}</td>
                  <td className="text-right tabular-nums">
                    {s.failed > 0 ? (
                      <span className="inline-flex items-center justify-end gap-1">
                        <FiAlertTriangle className="h-3.5 w-3.5 text-[#d03b3b]" aria-hidden />
                        {s.failed}
                      </span>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </DashCard>

        <DashCard title="Letzte Fehler">
          {m.recentFailures.length === 0 ? (
            <p className="flex items-center gap-2 text-sm">
              <FiCheckCircle className="h-4 w-4 text-[#0ca30c]" aria-hidden />
              Keine fehlgeschlagene Mail im Protokoll.
            </p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {m.recentFailures.map((f) => (
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
          <p className="mt-3 text-xs text-neutral-500">Häufige Ursachen: fehlender oder falscher RESEND_API_KEY, eine nicht verifizierte Absender-Domain oder ein Limit beim Mail-Dienst.</p>
        </DashCard>
      </div>

      <DashCard title="Mailing" right={o.enabled ? "an" : "aus"}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
          <Stat value={o.addresses.toLocaleString("de-DE")} label="Adressen in den Listen" />
          <Stat value={o.consented.toLocaleString("de-DE")} label="mit Einwilligung (werden angeschrieben)" />
          <Stat value={o.withoutConsent.toLocaleString("de-DE")} label="ohne Einwilligung (werden nie angeschrieben)" />
          <Stat value={o.suppressions.toLocaleString("de-DE")} label="Abmeldungen und Sperren" />
        </div>
        {!o.enabled && <p className="mt-4 text-sm">Das Mailing ist ausgeschaltet. Es startet erst mit der Einstellung OUTREACH_ENABLED=1, und auch dann nur an Adressen mit Einwilligung.</p>}
        {o.mailings.length > 0 && (
          <div className="mt-4">
            <DataTable head={[{ label: "Betreff" }, { label: "An" }, { label: "Versendet", right: true }, { label: "Datum", right: true }]}>
              {o.mailings.map((x) => (
                <tr key={x.id}>
                  <td className="font-bold">{x.subject}</td>
                  <td>{x.side === "STARTUP" ? "Marken" : "Creator"}</td>
                  <td className="text-right tabular-nums">{x.sent}</td>
                  <td className="text-right text-neutral-600 tabular-nums dark:text-neutral-400">
                    <LocalDate ms={x.at.getTime()} locale="de-DE" />
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}
        <p className="mt-3 text-xs">
          <Link href="/admin/mailing" className="font-bold underline underline-offset-2">
            Zum Mailing
          </Link>
          <span className="text-neutral-500"> · </span>
          <Link href="/admin/waitlist" className="font-bold underline underline-offset-2">
            Zur Warteliste
          </Link>
          <span className="text-neutral-500"> · </span>
          <Link href="/admin/email" className="font-bold underline underline-offset-2">
            E-Mail-Vorschau und Testmail
          </Link>
        </p>
      </DashCard>
    </div>
  );
}
