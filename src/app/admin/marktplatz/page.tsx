import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-session";
import { durationLabel, loadMarket } from "@/lib/admin-market";
import { ColumnChart, DashCard, DataTable, FunnelBars, KpiTile, PageHeader, Stat } from "@/components/admin/dashboard-parts";

export const metadata = { title: "Marktplatz" };

export default async function AdminMarketPage() {
  await requireAdminSession();
  const m = await loadMarket();
  const perOpen = m.openTotal > 0 ? (m.creatorsTotal / m.openTotal).toLocaleString("de-DE", { maximumFractionDigits: 1 }) : "–";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marktplatz"
        sub="Findet sich zusammen, was zusammengehört? Gemessen daran, wie schnell Anfragen Interesse bekommen, wie schnell geantwortet wird und wie viele Gespräche im Geld enden."
      />

      <div className="grid gap-[var(--gap,1rem)] sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Bis zum ersten Interesse" value={durationLabel(m.timeToFirstInterest)} hint="Median über Anfragen der letzten 90 Tage" />
        <KpiTile label="Marken antworten in" value={durationLabel(m.responseBrands)} hint="Median, Nachrichten der letzten 90 Tage" />
        <KpiTile label="Creator antworten in" value={durationLabel(m.responseCreators)} hint="Median, Nachrichten der letzten 90 Tage" />
        <KpiTile
          label="Ohne Interesse"
          value={m.unansweredTotal.toLocaleString("de-DE")}
          hint={`Offene Anfragen, älter als ${m.unansweredAfterDays} Tage, noch ohne Interesse`}
        />
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Anfragen mit Interesse" right="je Woche, in Prozent">
          <ColumnChart points={m.weeks.map((w) => ({ label: w.label, value: w.rate ?? 0 }))} format={(v) => `${v} %`} />
          <p className="mt-3 text-xs text-neutral-500">Anteil der Anfragen einer Woche, die inzwischen mindestens ein Interesse bekommen haben. Je Woche das Datum, an dem sie beginnt.</p>
        </DashCard>
        <DashCard title="Von der Nachricht zum Geld" right="Gespräche der letzten 90 Tage">
          <FunnelBars steps={m.funnel} />
          <div className="mt-4 grid grid-cols-2 gap-x-5">
            <Stat value={m.refunded.toLocaleString("de-DE")} label="zurückerstattet" />
            <Stat value={m.disputed.toLocaleString("de-DE")} label="Streitfälle" />
          </div>
        </DashCard>
      </div>

      <DashCard title="Die letzten acht Wochen">
        <DataTable head={[{ label: "Woche ab" }, { label: "Anfragen", right: true }, { label: "mit Interesse", right: true }, { label: "Quote", right: true }, { label: "Neues Interesse", right: true }]}>
          {[...m.weeks].reverse().map((w) => (
            <tr key={w.label}>
              <td className="font-bold">{w.label}</td>
              <td className="text-right tabular-nums">{w.requests}</td>
              <td className="text-right tabular-nums">{w.withInterest}</td>
              <td className="text-right tabular-nums">{w.rate === null ? "–" : `${w.rate} %`}</td>
              <td className="text-right tabular-nums">{w.interests}</td>
            </tr>
          ))}
        </DataTable>
      </DashCard>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Angebot und Nachfrage" right={`${m.openTotal} offene Anfragen · ${m.creatorsTotal} Creator · ${perOpen} Creator je Anfrage`}>
          {m.niches.length === 0 ? (
            <p className="text-sm text-neutral-500">Gerade keine offenen Anfragen.</p>
          ) : (
            <DataTable head={[{ label: "Nische" }, { label: "Offene Anfragen", right: true }, { label: "Creator", right: true }]}>
              {m.niches.map((n) => (
                <tr key={n.niche}>
                  <td className="font-bold">{n.niche}</td>
                  <td className="text-right tabular-nums">{n.requests}</td>
                  <td className={`text-right tabular-nums ${n.creators === 0 ? "font-bold" : ""}`}>{n.creators}</td>
                </tr>
              ))}
            </DataTable>
          )}
          <p className="mt-3 text-xs text-neutral-500">Eine Nische mit Anfragen, aber ohne Creator, kann nichts zurückbekommen. Dort lohnt es sich, gezielt Creator zu suchen.</p>
        </DashCard>

        <DashCard title="Anfragen ohne Interesse" right={m.unansweredTotal > m.unanswered.length ? `die ältesten ${m.unanswered.length} von ${m.unansweredTotal}` : undefined}>
          {m.unanswered.length === 0 ? (
            <p className="text-sm text-neutral-500">Alle offenen Anfragen haben Interesse bekommen oder sind noch neu.</p>
          ) : (
            <DataTable head={[{ label: "Anfrage" }, { label: "Marke" }, { label: "Alter", right: true }]}>
              {m.unanswered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/requests?q=${encodeURIComponent(r.title)}`} className="font-bold underline-offset-2 hover:underline">
                      {r.title}
                    </Link>
                    <span className="block text-xs text-neutral-500">{r.niche}</span>
                  </td>
                  <td>{r.brand}</td>
                  <td className="text-right tabular-nums">{r.ageDays} Tage</td>
                </tr>
              ))}
            </DataTable>
          )}
        </DashCard>
      </div>
    </div>
  );
}
