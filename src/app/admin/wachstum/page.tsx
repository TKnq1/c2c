import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi";
import { requireAdminSession } from "@/lib/admin-session";
import { loadGrowth } from "@/lib/admin-growth";
import { DailyBarChart } from "@/components/admin/daily-bar-chart";
import { DashCard, DataTable, FunnelBars, KpiTile, PageHeader, ShareBars, Stat, money } from "@/components/admin/dashboard-parts";

export const metadata = { title: "Wachstum" };

export default async function AdminGrowthPage() {
  await requireAdminSession();
  const g = await loadGrowth();
  const total = (points: { value: number }[]) => points.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Wachstum"
        sub="Wer kommt, wer bleibt und wo springen Leute ab. „Aktiv“ heißt: angemeldet, eine Anfrage gestellt, Interesse gezeigt oder eine Nachricht geschickt."
      />

      <div className="grid gap-[var(--gap,1rem)] sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Aktiv in 7 Tagen" value={g.active7.toLocaleString("de-DE")} hint="Nutzer mit mindestens einer Aktion" />
        <KpiTile label="Aktiv in 30 Tagen" value={g.active30.toLocaleString("de-DE")} hint="Nutzer mit mindestens einer Aktion" />
        <KpiTile
          label="Aktivierung"
          value={g.activation.rate === null ? "–" : `${g.activation.rate} %`}
          hint={`Neue der letzten 60 Tage, die in der ersten Woche etwas getan haben (${g.activation.cohort} Nutzer)`}
        />
        <KpiTile
          label="Wiederkehr"
          value={g.retention.rate === null ? "–" : `${g.retention.rate} %`}
          hint={`Vor 7 bis 37 Tagen angemeldet und diese Woche wieder aktiv (${g.retention.cohort} Nutzer)`}
        />
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DailyBarChart title="Neue Marken pro Tag" points={g.signupsBrands} unit="count" total={`${total(g.signupsBrands).toLocaleString("de-DE")} in 30 Tagen`} />
        <DailyBarChart title="Neue Creator pro Tag" points={g.signupsCreators} unit="count" total={`${total(g.signupsCreators).toLocaleString("de-DE")} in 30 Tagen`} />
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Funnel der Marken" right="Anmeldungen der letzten 90 Tage">
          <FunnelBars steps={g.funnelBrands} />
        </DashCard>
        <DashCard title="Funnel der Creator" right="Anmeldungen der letzten 90 Tage">
          <FunnelBars steps={g.funnelCreators} />
        </DashCard>
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Diese Woche und die Woche davor">
          <DataTable head={[{ label: "" }, { label: "Diese Woche", right: true }, { label: "Davor", right: true }, { label: "Änderung", right: true }]}>
            {g.week.map((row) => (
              <tr key={row.label}>
                <td className="font-bold">{row.label}</td>
                <td className="text-right tabular-nums">{row.money ? money(row.current) : row.current.toLocaleString("de-DE")}</td>
                <td className="text-right text-neutral-600 tabular-nums dark:text-neutral-400">{row.money ? money(row.previous) : row.previous.toLocaleString("de-DE")}</td>
                <td className="text-right tabular-nums">
                  {row.change === null ? (
                    <span className="text-neutral-500">–</span>
                  ) : (
                    <span className="inline-flex items-center justify-end gap-1">
                      {row.change >= 0 ? <FiArrowUpRight className="h-3.5 w-3.5 text-[#0ca30c]" aria-hidden /> : <FiArrowDownRight className="h-3.5 w-3.5 text-[#d03b3b]" aria-hidden />}
                      {row.change > 0 ? "+" : ""}
                      {row.change} %
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </DashCard>

        <DashCard title="Pro-Abos">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Stat value={g.pro.paying.toLocaleString("de-DE")} label="zahlen gerade" />
            <Stat value={g.pro.started30.toLocaleString("de-DE")} label="gestartet in 30 Tagen" />
            <Stat value={g.pro.ended30.toLocaleString("de-DE")} label="gekündigt in 30 Tagen" />
            <Stat value={`${g.pro.started90} / ${g.pro.ended90}`} label="gestartet / gekündigt in 90 Tagen" />
          </div>
          <p className="mt-4 text-xs text-neutral-500">Starts und Kündigungen werden erst seit diesem Update mitgeschrieben, davor gibt es keine Zahlen. Founding-Plätze zählen nicht.</p>
        </DashCard>
      </div>

      <DashCard title="Wie haben sie von uns erfahren?" right="Anmeldungen der letzten 90 Tage">
        {g.heard.length === 0 ? (
          <p className="text-sm text-neutral-500">Noch keine Anmeldungen im Zeitraum.</p>
        ) : (
          <ShareBars items={g.heard.map((h) => ({ label: h.label, value: h.count }))} />
        )}
        <p className="mt-4 text-xs text-neutral-500">Die Frage am Ende des Onboardings ist freiwillig, deshalb gibt es eine Zeile „Keine Angabe“. Kanäle aus Anzeigen findest du unter „Ads &amp; Kanäle“.</p>
      </DashCard>
    </div>
  );
}
