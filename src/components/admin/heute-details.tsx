import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";
import { orderedTiles, type AdminPrefs, type TileKey } from "@/lib/admin-prefs";
import { loadDashboard } from "@/lib/admin-dashboard";
import { loadMoney, runwayText } from "@/lib/admin-money";
import { loadAds } from "@/lib/admin-ads";
import { paymentStage } from "@/lib/payment-stage";
import { DashCard, FunnelBars, GoalRing, KpiTile, Stat, money } from "@/components/admin/dashboard-parts";
import { DailyBarChart } from "@/components/admin/daily-bar-chart";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { LocalDate } from "@/components/local-date";
import { RoleBadge } from "@/components/admin/role-badge";

// Blocks that sit next to each other on wide screens take half the row.
const HALF: TileKey[] = ["geld", "ziele", "markt", "funnel", "ads", "anmeldungen"];

// Everything on "Heute" below the fold: the full set of figures, money, ads, the funnel and the newest users and payments.
// It sits behind "Mehr Details" and streams in after the top of the page, so the part that matters is never held up by it.
export async function HeuteDetails({ prefs, now }: { prefs: AdminPrefs; now: Date }) {
  const visible = orderedTiles(prefs.tileOrder, prefs.hiddenTiles);

  // The money and ad figures cost extra queries, so they are only fetched when their block is shown.
  const [data, recentUsers, recentPayments, cash, ads] = await Promise.all([
    loadDashboard(now),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { startupProfile: true, creatorProfile: true } }),
    prisma.interest.findMany({
      where: { paymentStatus: { in: ["HELD", "RELEASED", "REFUNDED"] } },
      include: { creator: true, request: { include: { startup: true } } },
      orderBy: { paidAt: "desc" },
      take: 6,
    }),
    visible.includes("geld") ? loadMoney(now) : null,
    visible.includes("ads") ? loadAds(now) : null,
  ]);

  const monthPercent = prefs.goalMonthlyFeeCents > 0 ? Math.round((data.fee.monthCents / prefs.goalMonthlyFeeCents) * 100) : 0;

  const tiles: Record<TileKey, React.ReactNode> = {
    kennzahlen: (
      <div className="grid gap-[var(--gap,1rem)] sm:grid-cols-2 xl:grid-cols-3">
        <KpiTile
          label="Nutzer"
          value={data.users.total.toLocaleString("de-DE")}
          change={data.users.change}
          trend={data.users.trend}
          hint={`${data.users.brands} Marken · ${data.users.creators} Creator · ${data.users.newLast30} neu in 30 Tagen`}
          href="/admin/users"
        />
        <KpiTile
          label="Offene Anfragen"
          value={data.requests.open.toLocaleString("de-DE")}
          hint={`${data.requests.closed} geschlossen · ${data.requests.all} insgesamt`}
          href="/admin/requests"
        />
        <KpiTile label="Collabs gestartet" value={data.requests.collabs.toLocaleString("de-DE")} hint="Gespräche zwischen Marken und Creatorn" href="/admin/requests" />
        <KpiTile
          label="Zahlungsvolumen"
          value={formatCents(data.volume.cents)}
          change={data.volume.change}
          trend={data.volume.trend}
          hint={`${data.volume.count} Zahlungen in 30 Tagen`}
          href="/admin/payments"
        />
        <KpiTile
          label="Provision"
          value={formatCents(data.fee.releasedCents)}
          hint={`${formatCents(data.fee.heldCents)} mehr, sobald das Escrow frei wird`}
          href="/admin/payments?status=RELEASED"
        />
        <KpiTile
          label="Pro-Abos"
          value={data.pro.paying.toLocaleString("de-DE")}
          hint={`${formatCents(data.pro.paying * PRO_SUBSCRIPTION_PRICE_CENTS)} im Monat · ${data.pro.founding} mit Founding-Platz`}
          href="/admin/users?role=STARTUP&pro=1"
        />
      </div>
    ),
    geld: cash && (
      <DashCard title="Geld" right={<Link href="/admin/geld" className="text-xs underline">Details</Link>} className="h-full">
        <p className="font-display text-[1.875rem] leading-9 font-black tracking-tight">{runwayText(cash.runway).big}</p>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          {cash.balanceCents === null ? "Trag auf der Geld-Seite deinen Kontostand ein." : `Kontostand ${money(cash.balanceCents)}`}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
          <Stat value={money(cash.feeMonth)} label="Provision diesen Monat" />
          <Stat value={money(cash.fixedMonthly + cash.adsLast30)} label="Kosten (Fixkosten und Ads, 30 Tage)" />
        </div>
      </DashCard>
    ),
    ads: ads && (
      <DashCard title="Ads" right={<Link href="/admin/ads" className="text-xs underline">Details</Link>} className="h-full">
        {ads.hasSpend ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Stat value={money(ads.spendCents)} label="Ausgaben in 30 Tagen" />
            <Stat value={ads.advertised.signups > 0 && ads.advertised.cpaCents !== null ? money(Math.round(ads.advertised.cpaCents)) : "–"} label="Kosten je Anmeldung" />
            <Stat
              value={ads.advertised.clickToSignup === null ? "–" : `${(ads.advertised.clickToSignup * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`}
              label="Klick zur Anmeldung"
            />
            <Stat value={`${ads.signupsTagged} von ${ads.signupsTotal}`} label="Anmeldungen mit Kampagnen-Angabe" />
          </div>
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Noch keine Ausgaben importiert. Unter „Ads &amp; Kanäle“ baust du einen Link mit Kampagnennamen und lädst die Ausgaben als CSV hoch.
          </p>
        )}
      </DashCard>
    ),
    ziele: (
      <DashCard title="Ziele" right={<Link href="/admin/anpassen" className="text-xs underline">ändern</Link>} className="h-full">
        <div className="grid grid-cols-3 gap-2">
          <GoalRing label="Founding-Marken" value={data.founding.brands} goal={prefs.goalBrands} display={`${data.founding.brands}/${prefs.goalBrands}`} sub={`noch ${Math.max(0, prefs.goalBrands - data.founding.brands)} Plätze`} />
          <GoalRing label="Founding-Creator" value={data.founding.creators} goal={prefs.goalCreators} display={`${data.founding.creators}/${prefs.goalCreators}`} sub={`noch ${Math.max(0, prefs.goalCreators - data.founding.creators)} Plätze`} />
          <GoalRing
            label="Provision im Monat"
            value={data.fee.monthCents}
            goal={prefs.goalMonthlyFeeCents}
            display={`${monthPercent} %`}
            sub={`${formatCents(data.fee.monthCents)} von ${formatCents(prefs.goalMonthlyFeeCents)}`}
          />
        </div>
      </DashCard>
    ),
    markt: (
      <DashCard title="Marktplatz-Gesundheit" right="letzte 30 Tage" className="h-full">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <Stat value={data.market.liquidity === null ? "–" : `${data.market.liquidity} %`} label="der neuen Anfragen bekommen Interesse" />
          <Stat value={data.market.requests30.toLocaleString("de-DE")} label="neue Anfragen" />
          <Stat value={data.market.creatorsPerBrand === null ? "–" : `${data.market.creatorsPerBrand.toLocaleString("de-DE")} : 1`} label="Creator pro Marke" />
          <Stat value={`${data.users.newLast30}`} label="neue Nutzer" />
        </div>
      </DashCard>
    ),
    funnel: (
      <DashCard title="Funnel" right="Anmeldungen der letzten 30 Tage" className="h-full">
        <FunnelBars steps={data.funnel} />
      </DashCard>
    ),
    anmeldungen: (
      <DailyBarChart title="Anmeldungen pro Tag" points={data.signupSeries} unit="count" total={`${data.users.newLast30.toLocaleString("de-DE")} in 30 Tagen`} />
    ),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        {visible.map((key) => (
          <div key={key} className={HALF.includes(key) ? "min-w-0" : "min-w-0 lg:col-span-2"}>
            {tiles[key]}
          </div>
        ))}
      </div>

      <div className="grid gap-[var(--gap,1rem)] lg:grid-cols-2">
        <DashCard title="Neueste Nutzer" right={<Link href="/admin/users" className="text-xs underline">Alle Nutzer</Link>}>
          <ul className="-my-1">
            {recentUsers.map((u) => (
              <li key={u.id} className="border-t border-ink/10 first:border-t-0">
                <Link href={`/admin/users/${u.id}`} className="flex items-center justify-between gap-3 py-2.5 transition hover:opacity-70">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{u.startupProfile?.companyName ?? u.creatorProfile?.displayName ?? u.email}</span>
                    <span className="block truncate text-xs text-neutral-500">
                      {(u.startupProfile || u.creatorProfile) && <>{u.email} · </>}
                      <LocalDate ms={u.createdAt.getTime()} locale="de-DE" />
                    </span>
                  </span>
                  <RoleBadge role={u.role} isAdmin={u.isAdmin} suspended={!!u.suspendedAt} />
                </Link>
              </li>
            ))}
          </ul>
        </DashCard>
        <DashCard title="Letzte Zahlungen" right={<Link href="/admin/payments" className="text-xs underline">Alle Zahlungen</Link>}>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-neutral-500">Noch keine Zahlungen.</p>
          ) : (
            <ul className="-my-1">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 border-t border-ink/10 py-2.5 first:border-t-0">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {p.request.startup.companyName} → {p.creator.displayName}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      {formatCents(p.amountCents!)} · {p.request.title}
                    </span>
                  </span>
                  <PaymentStatusBadge status={paymentStage({ ...p, paymentStatus: p.paymentStatus! })} />
                </li>
              ))}
            </ul>
          )}
        </DashCard>
      </div>
    </div>
  );
}
