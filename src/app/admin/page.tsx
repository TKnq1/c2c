import Link from "next/link";
import { FiSliders } from "react-icons/fi";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { formatCents } from "@/lib/format";
import { PRO_SUBSCRIPTION_PRICE_CENTS } from "@/lib/constants";
import { orderedTiles, type TileKey } from "@/lib/admin-prefs";
import { getAdminPrefs } from "@/lib/admin-prefs-server";
import { loadDashboard } from "@/lib/admin-dashboard";
import { listOpenTasks } from "@/lib/admin-tasks";
import { paymentStage } from "@/lib/payment-stage";
import { DashCard, FunnelBars, GoalRing, KpiTile } from "@/components/admin/dashboard-parts";
import { DailyBarChart } from "@/components/admin/daily-bar-chart";
import { TaskList } from "@/components/admin/task-list";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { LocalDate } from "@/components/local-date";
import { RoleBadge } from "@/components/admin/role-badge";

const TIME_ZONE = "Europe/Berlin";

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("de-DE", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now));
  return hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
}

// Blocks that sit next to each other on wide screens take half the row.
const HALF: TileKey[] = ["ziele", "markt", "funnel", "anmeldungen"];

export default async function AdminTodayPage() {
  const session = await requireAdminSession();
  const prefs = await getAdminPrefs(session.user.id);
  const now = new Date();

  const [data, tasks, recentUsers, recentPayments] = await Promise.all([
    loadDashboard(now),
    listOpenTasks(now),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { startupProfile: true, creatorProfile: true } }),
    prisma.interest.findMany({
      where: { paymentStatus: { in: ["HELD", "RELEASED", "REFUNDED"] } },
      include: { creator: true, request: { include: { startup: true } } },
      orderBy: { paidAt: "desc" },
      take: 6,
    }),
  ]);

  const dateLabel = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE }).format(now);
  const name = prefs.displayName ? `, ${prefs.displayName}` : "";
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

  const visible = orderedTiles(prefs.tileOrder, prefs.hiddenTiles);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pr-0 group-data-[panel=closed]/shell:lg:pr-28">
        <div>
          <h1 className="font-display text-title-1 font-black">Heute</h1>
          <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
            {greeting(now)}
            {name} · {dateLabel}
          </p>
        </div>
        <Link
          href="/admin/anpassen"
          className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-3.5 py-1.5 text-xs font-bold transition hover:bg-fog"
        >
          <FiSliders className="h-4 w-4" aria-hidden />
          Anpassen
        </Link>
      </div>

      {/* Phones and tablets have no side panel, so the open tasks sit here. */}
      <DashCard title="Offen" right={`${tasks.length}`} className="lg:hidden">
        <TaskList
          tasks={tasks.map((t) => ({ id: t.id, title: t.title, reason: t.reason, priority: t.priority, source: t.source, href: t.href }))}
          compact
          empty="Nichts offen. Gut so."
        />
      </DashCard>

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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-[1.375rem] leading-7 font-black tracking-tight">{value}</p>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">{label}</p>
    </div>
  );
}
