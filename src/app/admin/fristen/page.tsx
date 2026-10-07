import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { requireAdminSession } from "@/lib/admin-session";
import { loadDeadlines } from "@/lib/admin-deadlines";
import { durationLabel } from "@/lib/admin-market";
import { DashCard, DataTable, KpiTile, PageHeader, Stat, money } from "@/components/admin/dashboard-parts";
import { LocalDate } from "@/components/local-date";

export const metadata = { title: "Fristen" };

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm">
      <FiCheckCircle className="h-4 w-4 text-[#0ca30c]" aria-hidden />
      {children}
    </p>
  );
}

const ageText = (days: number) => (days <= 0 ? "heute" : days === 1 ? "1 Tag" : `${days} Tage`);

export default async function AdminDeadlinesPage() {
  await requireAdminSession();
  const d = await loadDeadlines();
  const overdue = d.releasing.filter((r) => r.overdue).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Fristen" sub="Alles, was bei dir wartet und nicht liegen bleiben soll: Meldungen, eingefrorenes Geld und Zahlungen, die sich bald von selbst freigeben." />

      <div className="grid gap-[var(--gap,1rem)] sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Offene Meldungen" value={String(d.reportsOpen)} hint={`Richtwert: in ${d.reportTargetDays} Tagen bearbeitet`} href="/admin/moderation" />
        <KpiTile label="Streitfälle" value={String(d.disputes.length)} hint="Geld eingefroren, bis du entscheidest" href="/admin/moderation" />
        <KpiTile label="Freigabe in Kürze" value={String(d.releasingTotal)} hint={overdue > 0 ? `${overdue} davon ab heute fällig` : "Zahlungen mit eingereichtem Beitrag"} href="/admin/payments" />
        <KpiTile
          label="Bearbeitungszeit Meldungen"
          value={durationLabel(d.turnaround)}
          hint={d.turnaroundCount > 0 ? `Median über ${d.turnaroundCount} erledigte Meldungen der letzten 90 Tage` : "Noch keine erledigte Meldung im Zeitraum"}
        />
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Offene Meldungen" right={d.reportsOpen > d.reports.length ? `die ältesten ${d.reports.length} von ${d.reportsOpen}` : undefined}>
          {d.reports.length === 0 ? (
            <Empty>Keine offene Meldung.</Empty>
          ) : (
            <DataTable head={[{ label: "Gegen" }, { label: "Grund" }, { label: "Alter", right: true }]}>
              {d.reports.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-[9rem]">
                    <span className="block truncate" title={r.about}>
                      {r.about}
                    </span>
                    {r.automatic && <span className="block text-xs whitespace-nowrap text-neutral-500">automatisch erkannt</span>}
                  </td>
                  <td>{r.reason}</td>
                  <td className="text-right whitespace-nowrap tabular-nums">
                    {r.late && <FiAlertTriangle className="mr-1 inline h-3.5 w-3.5 text-[#d03b3b]" aria-label="überfällig" />}
                    {ageText(r.ageDays)}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
          <p className="mt-3 text-xs">
            <Link href="/admin/moderation" className="font-bold underline underline-offset-2">
              Zur Moderation
            </Link>
          </p>
        </DashCard>

        <DashCard title="Streitfälle" right="Geld eingefroren">
          {d.disputes.length === 0 ? (
            <Empty>Kein offener Streitfall.</Empty>
          ) : (
            <DataTable head={[{ label: "Anfrage" }, { label: "Betrag", right: true }, { label: "Seit", right: true }]}>
              {d.disputes.map((x) => (
                <tr key={x.id}>
                  <td className="font-bold">{x.title}</td>
                  <td className="text-right tabular-nums">{money(x.amountCents)}</td>
                  <td className="text-right whitespace-nowrap tabular-nums">{ageText(x.ageDays)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </DashCard>
      </div>

      <DashCard title="Automatische Freigabe" right={`${d.releasingTotal} warten`}>
        {d.releasing.length === 0 ? (
          <Empty>Keine Zahlung wartet auf die Freigabe.</Empty>
        ) : (
          <DataTable head={[{ label: "Anfrage" }, { label: "Betrag", right: true }, { label: "Wird freigegeben", right: true }]}>
            {d.releasing.map((r) => (
              <tr key={r.id}>
                <td className="font-bold">{r.title}</td>
                <td className="text-right tabular-nums">{money(r.amountCents)}</td>
                <td className="text-right whitespace-nowrap">
                  {r.overdue ? (
                    <span className="font-bold">heute</span>
                  ) : (
                    <LocalDate ms={r.at.getTime()} locale="de-DE" />
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        <p className="mt-3 text-xs text-neutral-500">
          Hat die Marke nach der Frist nicht geantwortet, gibt der tägliche Job die Zahlung an den Creator frei. Wer vorher einen Streitfall meldet, stoppt das.
        </p>
      </DashCard>

      <DashCard title="Datenschutz">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
          <Stat value={String(d.deleted30)} label="Konten in 30 Tagen gelöscht" />
          <Stat value={String(d.pendingConsents)} label="Produkt-News warten auf Bestätigung" />
        </div>
        <p className="mt-4 text-sm">
          Anfragen per Mail an info@comtor.app, etwa auf Auskunft oder Löschung, sind ohne unnötige Verzögerung zu beantworten, spätestens nach einem Monat (Art. 12 DSGVO). Konten löschen Nutzer selbst in den Einstellungen, über die Mailanfrage läuft nur, was dort nicht geht.
        </p>
      </DashCard>
    </div>
  );
}
