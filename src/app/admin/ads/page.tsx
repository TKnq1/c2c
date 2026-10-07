import { requireAdminSession } from "@/lib/admin-session";
import { loadAds } from "@/lib/admin-ads";
import { channelLabel } from "@/lib/ad-import";
import { AdImport, AdSpendForm, DeleteSpendButton, LinkBuilder } from "@/components/admin/ads-forms";
import { DailyBarChart } from "@/components/admin/daily-bar-chart";
import { DashCard, DataTable, FunnelBars, KpiTile, PageHeader, money } from "@/components/admin/dashboard-parts";
import { SITE_URL } from "@/lib/site";

export const metadata = { title: "Ads & Kanäle" };

const dash = "–";
const percent = (value: number | null) => (value === null ? dash : `${(value * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`);
const euro = (cents: number | null, spend = 1) => (cents === null || spend === 0 ? dash : money(Math.round(cents)));
const channelName = (channel: string) => (channel === "none" ? "Ohne Angabe (direkt, Suche, Mundpropaganda)" : channelLabel(channel));

export default async function AdminAdsPage() {
  await requireAdminSession();
  const a = await loadAds();
  const total = (points: { value: number }[]) => points.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ads & Kanäle"
        sub={`Was die Werbung kostet und was sie bringt, jeweils die letzten ${a.days} Tage. Ausgaben kommen aus dem Import, Anmeldungen aus dem Kampagnennamen im Link.`}
      />

      <div className="grid gap-[var(--gap,1rem)] sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Ausgaben" value={a.hasSpend ? money(a.spendCents) : dash} hint={a.hasSpend ? `${a.clicks.toLocaleString("de-DE")} Klicks, ${a.impressions.toLocaleString("de-DE")} Impressionen` : "Noch nichts importiert"} />
        <KpiTile
          label="Kosten je Anmeldung"
          value={a.advertised.signups > 0 ? euro(a.advertised.cpaCents, a.advertised.spendCents) : dash}
          hint={`${a.advertised.signups} Anmeldungen über Kampagnen mit Ausgaben`}
        />
        <KpiTile label="Klick zur Anmeldung" value={percent(a.advertised.clickToSignup)} hint="Anmeldungen geteilt durch Klicks" />
        <KpiTile
          label="Anmeldungen mit Kampagnen-Angabe"
          value={`${a.signupsTagged} von ${a.signupsTotal}`}
          hint="Alle anderen kamen ohne Link mit utm-Angabe"
        />
      </div>

      <div className="grid items-start gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Vom Klick zur Collab" right="Kampagnen mit Ausgaben">
          {a.advertised.clicks === 0 && a.advertised.signups === 0 ? (
            <p className="text-sm text-neutral-500">Sobald Ausgaben importiert sind und Anmeldungen über denselben Kampagnennamen kommen, steht hier der Weg vom Klick bis zur ersten bezahlten Collab.</p>
          ) : (
            <FunnelBars steps={a.funnel} />
          )}
          {a.advertised.feeCents > 0 && (
            <p className="mt-4 text-sm">
              Provision aus diesen Konten bisher: <b>{money(a.advertised.feeCents)}</b>
            </p>
          )}
        </DashCard>
        <div className="grid gap-[var(--gap,1rem)]">
          <DailyBarChart title="Ausgaben pro Tag" points={a.spendByDay} unit="cents" total={money(total(a.spendByDay))} />
          <DailyBarChart title="Anmeldungen mit Kampagnen-Angabe pro Tag" points={a.taggedByDay} unit="count" total={`${total(a.taggedByDay)} in ${a.days} Tagen`} />
        </div>
      </div>

      <DashCard title="Kampagnen" right={`${a.campaigns.length}`}>
        {a.campaigns.length === 0 ? (
          <p className="text-sm text-neutral-500">Noch keine Kampagnen. Baue unten einen Link und importiere die Ausgaben.</p>
        ) : (
          <DataTable
            head={[
              { label: "Kampagne" },
              { label: "Ausgaben", right: true },
              { label: "Klicks", right: true, hideSmall: true },
              { label: "Anmeldungen", right: true },
              { label: "Je Anmeldung", right: true },
              { label: "Aktiv", right: true, hideSmall: true },
              { label: "Bezahlt", right: true, hideSmall: true },
              { label: "Provision", right: true, hideSmall: true },
            ]}
          >
            {a.campaigns.map((c) => (
              <tr key={c.key}>
                <td>
                  <span className="font-bold">{c.name}</span>
                  <span className="block text-xs text-neutral-500">{c.channels.length > 0 ? c.channels.map(channelLabel).join(", ") : "ohne importierte Ausgaben"}</span>
                </td>
                <td className="text-right tabular-nums">{c.spendCents > 0 ? money(c.spendCents) : dash}</td>
                <td className="text-right tabular-nums">{c.clicks > 0 ? c.clicks.toLocaleString("de-DE") : dash}</td>
                <td className="text-right tabular-nums">
                  {c.signups}
                  {c.signups > 0 && (
                    <span className="block text-xs text-neutral-500">
                      {c.brands} Marken, {c.creators} Creator
                    </span>
                  )}
                </td>
                <td className="text-right tabular-nums">{euro(c.cpaCents, c.spendCents)}</td>
                <td className="text-right tabular-nums">{c.activated}</td>
                <td className="text-right tabular-nums">{c.payers}</td>
                <td className="text-right tabular-nums">{c.feeCents > 0 ? money(c.feeCents) : dash}</td>
              </tr>
            ))}
          </DataTable>
        )}
        <p className="mt-3 text-xs text-neutral-500">
          Ausgaben und Anmeldungen finden sich über den Kampagnennamen. Eine Zeile ohne Ausgaben ist ein Link ohne bezahlte Werbung, zum Beispiel ein Beitrag oder ein Creator-Link. „Aktiv“ heißt: erste Anfrage oder erstes Interesse.
        </p>
      </DashCard>

      <DashCard title="Kanäle">
        <DataTable
          head={[
            { label: "Kanal" },
            { label: "Ausgaben", right: true },
            { label: "Anmeldungen", right: true },
            { label: "Je Anmeldung", right: true },
            { label: "Aktiv", right: true, hideSmall: true },
            { label: "Mit bezahlter Collab", right: true, hideSmall: true },
          ]}
        >
          {a.channels.map((c) => (
            <tr key={c.channel}>
              <td className="font-bold">{channelName(c.channel)}</td>
              <td className="text-right tabular-nums">{c.spendCents > 0 ? money(c.spendCents) : dash}</td>
              <td className="text-right tabular-nums">{c.signups}</td>
              <td className="text-right tabular-nums">{euro(c.cpaCents, c.spendCents)}</td>
              <td className="text-right tabular-nums">{c.activated}</td>
              <td className="text-right tabular-nums">{c.payers}</td>
            </tr>
          ))}
        </DataTable>
        <p className="mt-3 text-xs text-neutral-500">Anmeldungen aus einer Kampagne mit Ausgaben zählen für deren Kanal. Alle anderen zählen nach der Quelle im Link, Anmeldungen ohne Angabe stehen in der ersten Zeile.</p>
      </DashCard>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Link für Anzeigen und Beiträge">
          <LinkBuilder siteUrl={SITE_URL} />
        </DashCard>
        <DashCard title="Ausgaben importieren">
          <AdImport />
          <h3 className="mt-5 mb-2 text-sm font-bold">Oder von Hand eintragen</h3>
          <AdSpendForm />
        </DashCard>
      </div>

      {a.recentSpend.length > 0 && (
        <DashCard title="Zuletzt eingetragene Ausgaben" right={`${a.recentSpend.length} neueste`}>
          <DataTable head={[{ label: "Tag" }, { label: "Kanal" }, { label: "Kampagne" }, { label: "Ausgaben", right: true }, { label: "Klicks", right: true, hideSmall: true }, { label: "" }]}>
            {a.recentSpend.map((s) => (
              <tr key={s.id}>
                <td className="tabular-nums">{s.day}</td>
                <td>{channelLabel(s.channel)}</td>
                <td>
                  {s.name}
                  <span className="block text-xs text-neutral-500">{s.source === "manual" ? "von Hand" : "Import"}</span>
                </td>
                <td className="text-right tabular-nums">{money(s.spendCents)}</td>
                <td className="text-right tabular-nums">{s.clicks.toLocaleString("de-DE")}</td>
                <td className="text-right">
                  <DeleteSpendButton id={s.id} label={`${s.name} am ${s.day}`} />
                </td>
              </tr>
            ))}
          </DataTable>
        </DashCard>
      )}
    </div>
  );
}
