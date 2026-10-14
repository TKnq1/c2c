import { requireAdminSession } from "@/lib/admin-session";
import { lastMonths, loadMoney, runwayText } from "@/lib/admin-money";
import { ColumnChart, DashCard, DataTable, LineChart, PageHeader, Stat, money } from "@/components/admin/dashboard-parts";
import { CashBalanceForm, FixedCostControls, FixedCostForm } from "@/components/admin/money-forms";
import { LocalDate } from "@/components/local-date";
import { PRO_PLATFORM_FEE_RATE, PLATFORM_FEE_RATE } from "@/lib/constants";

export const metadata = { title: "Geld" };

const signed = (cents: number) => `${cents >= 0 ? "+" : "−"}${money(Math.abs(cents))}`;

export default async function AdminMoneyPage() {
  await requireAdminSession();
  const m = await loadMoney();
  const runway = runwayText(m.runway);
  const exportMonths = lastMonths(new Date(), 12).map((slot) => ({ value: slot.key, label: slot.start.toLocaleDateString("de-DE", { month: "long", year: "numeric", timeZone: "UTC" }) }));
  // The quarters the last twelve months touch, oldest first like the months.
  const exportQuarters = [
    ...new Map(
      exportMonths.map((month) => {
        const [year, mm] = month.value.split("-");
        const quarter = Math.floor((Number(mm) - 1) / 3) + 1;
        return [`${year}-Q${quarter}`, { value: `${year}-Q${quarter}`, label: `Q${quarter} ${year}` }] as const;
      }),
    ).values(),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Geld" sub="Einnahmen, Kosten und wie lange das Geld reicht. Kontostand und Fixkosten trägst du selbst ein, der Rest kommt aus den Zahlungen." />

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Reichweite des Geldes" className="flex flex-col gap-3">
          <p className="font-display text-[2.75rem] leading-[3rem] font-black tracking-tight">{runway.big}</p>
          <p className="-mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">{runway.small}</p>
          {m.balanceCents !== null && (
            <p className="text-sm">
              Kontostand <b>{money(m.balanceCents)}</b>
              {m.balanceAt && (
                <span className="text-neutral-500">
                  {" "}
                  vom <LocalDate ms={m.balanceAt.getTime()} locale="de-DE" />
                </span>
              )}
              {m.netBurn > 0 && <span className="text-neutral-500"> · Verbrauch {money(m.netBurn)} im Monat</span>}
            </p>
          )}
          <CashBalanceForm initial={m.balanceCents === null ? "" : String(m.balanceCents / 100).replace(".", ",")} />
          <LineChart points={m.balanceHistory} format={money} />
        </DashCard>

        <DashCard title="Dieser Monat" right="bisher">
          <ul className="text-sm">
            {[
              ["Provision (freigegebene Zahlungen)", signed(m.feeMonth)],
              [`Pro-Abos (${m.paying} zahlende, geschätzt)`, signed(m.proMrr)],
              ["Fixkosten", signed(-m.fixedMonthly)],
              ["Ads (Import)", signed(-m.adsThisMonth)],
            ].map(([label, value]) => (
              <li key={label} className="flex justify-between gap-3 border-t border-ink/10 py-2.5 first:border-t-0 first:pt-0">
                <span>{label}</span>
                <span className="tabular-nums">{value}</span>
              </li>
            ))}
            <li className="mt-1 flex justify-between gap-3 border-t-2 border-ink pt-3 font-black">
              <span>Ergebnis</span>
              <span className="tabular-nums">{signed(m.resultMonth)}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-neutral-500">
            Provision ist {PLATFORM_FEE_RATE * 100} % je Zahlung, bei Pro {PRO_PLATFORM_FEE_RATE * 100} %. Gerechnet wird, was im Monat freigegeben wurde.
          </p>
        </DashCard>
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Provision pro Monat" right="freigegebene Zahlungen">
          <ColumnChart points={m.feeByMonth} format={money} />
        </DashCard>
        <DashCard title="Gelder auf der Plattform">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Stat value={money(m.platform.escrowCents)} label="im Escrow gehalten" />
            <Stat value={money(m.platform.paidOutCents)} label="an Creator ausgezahlt" />
            <Stat value={money(m.platform.refundedCents)} label="erstattet" />
            <Stat value={m.platform.refundRatePct === null ? "–" : `${m.platform.refundRatePct.toLocaleString("de-DE")} %`} label="Erstattungsquote" />
            <Stat value={money(m.platform.volumeCents)} label="Bruttovolumen" />
            <Stat value={m.platform.takeRatePct === null ? "–" : `${m.platform.takeRatePct.toLocaleString("de-DE")} %`} label="Take Rate" />
          </div>
        </DashCard>
      </div>

      <DashCard title="Export für den Steuerberater" right="CSV">
        <form action="/api/admin/export/payments" method="get" className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-bold">Monat</span>
            <select name="month" defaultValue={exportMonths[exportMonths.length - 1].value} className="rounded border border-ink/15 bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink">
              {[...exportMonths].reverse().map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-paper transition">
            CSV herunterladen
          </button>
        </form>
        <p className="mt-3 text-xs text-neutral-500">
          Eine Zeile je Zahlung, die in dem Monat eingegangen, freigegeben oder erstattet wurde, mit Summen am Ende. Für Excel mit Semikolon und Dezimalkomma. Ohne Pro-Abos (die stehen im Stripe-Export) und ohne Kautionen. Jeder Download wird protokolliert. Die steuerliche Einordnung klärst du mit dem Steuerberater.
        </p>

        <form action="/api/admin/export/invoices" method="get" className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-bold">Belege, Monat</span>
            <select name="month" defaultValue={exportMonths[exportMonths.length - 1].value} className="rounded border border-ink/15 bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink">
              {[...exportMonths].reverse().map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-paper transition">
            Belege als CSV
          </button>
        </form>
        <p className="mt-3 text-xs text-neutral-500">
          Alle Rechnungen, Gutschriften und Stornos, die im Monat ausgestellt wurden, mit Steuerbehandlung und Summen. Ein stornierter Beleg steht mit seinem Storno in der Liste: beide zusammen ergeben null.
        </p>

        <form action="/api/admin/export/invoices" method="get" className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
          <input type="hidden" name="report" value="zm" />
          <label className="flex items-center gap-2 text-sm">
            <span className="font-bold">Zusammenfassende Meldung, Quartal</span>
            <select name="quarter" defaultValue={exportQuarters[exportQuarters.length - 1].value} className="rounded border border-ink/15 bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink">
              {[...exportQuarters].reverse().map((quarter) => (
                <option key={quarter.value} value={quarter.value}>
                  {quarter.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-paper transition">
            Meldung als CSV
          </button>
        </form>
        <p className="mt-3 text-xs text-neutral-500">
          Die Leistungen an Unternehmen in anderen EU-Ländern, bei denen der Kunde die Umsatzsteuer schuldet, je USt-IdNr. mit dem Meldebetrag in vollen Euro. Die Meldung gibst du selbst im BZSt-Portal ab oder dein Steuerberater.
        </p>
      </DashCard>

      <DashCard title="Fixkosten" right={`${money(m.fixedMonthly)} im Monat`}>
        <div className="mb-4">
          <FixedCostForm />
        </div>
        {m.costs.length === 0 ? (
          <p className="text-sm text-neutral-500">Noch nichts eingetragen. Typisch: Vercel, Neon, Resend, Domain, Werkzeuge.</p>
        ) : (
          <DataTable head={[{ label: "Posten" }, { label: "Betrag", right: true }, { label: "Rhythmus" }, { label: "Notiz" }, { label: "Zählt mit", right: true }]}>
            {m.costs.map((c) => (
              <tr key={c.id} className={c.active ? "" : "text-neutral-500"}>
                <td className="font-bold">{c.name}</td>
                <td className="text-right tabular-nums">{money(c.amountCents)}</td>
                <td>{c.interval === "MONTHLY" ? "pro Monat" : "pro Jahr"}</td>
                <td className="text-neutral-600 dark:text-neutral-400">{c.note}</td>
                <td>
                  <FixedCostControls id={c.id} name={c.name} active={c.active} />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </DashCard>
    </div>
  );
}
