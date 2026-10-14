import { Suspense } from "react";
import type { IconType } from "react-icons";
import { FiActivity, FiBarChart2, FiClock, FiCreditCard, FiMessageSquare, FiMousePointer, FiPercent, FiStar, FiTag, FiTarget, FiUsers } from "react-icons/fi";
import { requireAdminSession } from "@/lib/admin-session";
import { getAdminPrefs } from "@/lib/admin-prefs-server";
import { FOCUS_SHOWN, focusSummary } from "@/lib/admin-focus";
import { loadAnomalies } from "@/lib/admin-anomalies";
import { loadDaySummary } from "@/lib/admin-dashboard";
import { loadKpis } from "@/lib/admin-kpis";
import { parsePeriod } from "@/lib/admin-period";
import { listOpenTasks } from "@/lib/admin-tasks";
import { loadDailyPlan } from "@/lib/admin-routines-server";
import { berlinHour, daySummary, greetingFor } from "@/lib/admin-today";
import { DailyPlan } from "@/components/admin/daily-plan";
import { Disclosure } from "@/components/admin/disclosure";
import { FocusCard } from "@/components/admin/focus-card";
import { HeuteColumn } from "@/components/admin/heute-column";
import { HeuteDetails } from "@/components/admin/heute-details";
import { KpiTile } from "@/components/admin/dashboard-parts";
import { firstParams } from "@/components/admin/list-controls";
import { PeriodTabs } from "@/components/admin/period-tabs";
import type { TaskView } from "@/components/admin/task-list";

const TIME_ZONE = "Europe/Berlin";

// The icon in front of each headline figure's name.
const KPI_ICONS: Record<string, IconType> = {
  users: FiUsers,
  active: FiActivity,
  founding: FiStar,
  waiting: FiMessageSquare,
  fee: FiPercent,
  volume: FiCreditCard,
  pro: FiStar,
  runway: FiClock,
  adspend: FiTarget,
  cpa: FiTarget,
  clicks: FiMousePointer,
  tagged: FiTag,
};

function DetailsSkeleton() {
  return (
    <div className="flex flex-col gap-[var(--gap,1rem)]" aria-busy="true" aria-label="Lädt">
      {[0, 1].map((i) => (
        <div key={i} className="adm-card h-40 animate-pulse" />
      ))}
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Lädt">
      {[0, 1, 2].map((i) => (
        <div key={i} className="adm-row h-24 animate-pulse" />
      ))}
    </div>
  );
}

// "Heute" answers one question first: does anything need me? Below that come four figures on growth, and everything else
// waits behind "Mehr Details". On a wide screen the deadlines, the latest notices and a line for the decision log stand beside it.
export default async function AdminTodayPage(props: PageProps<"/admin">) {
  const session = await requireAdminSession();
  const prefs = await getAdminPrefs(session.user.id);
  const now = new Date();
  const period = parsePeriod(firstParams(await props.searchParams).z);
  const [tiles, tasks, anomalies, day, plan] = await Promise.all([
    loadKpis({ now, period, prefs }),
    listOpenTasks(now),
    loadAnomalies(now),
    loadDaySummary(now),
    loadDailyPlan(session.user.id, now),
  ]);

  const summary = focusSummary(tasks);
  const views: TaskView[] = tasks
    .filter((t) => t.priority !== "LOW")
    .slice(0, FOCUS_SHOWN)
    .map((t) => ({ id: t.id, title: t.title, reason: t.reason, priority: t.priority, source: t.source, href: t.href }));

  const line = daySummary({ newUsers: day.newUsers, payments: day.payments, waiting: summary.urgentTotal });
  const dateLabel = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE }).format(now);
  const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE }).format(now);

  return (
    <div className="flex flex-col gap-7">
      <header className="lg:pr-60 xl:pr-[31rem]">
        <h1 className="font-display text-[2.25rem] leading-[1.05] font-black tracking-[-0.035em] sm:text-[2.75rem]">
          {greetingFor(berlinHour(now))}
          {prefs.displayName && (
            <>
              , <span className="text-(--accent-ink)">{prefs.displayName}</span>
            </>
          )}
          .
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {dateLabel} · Stand {time} Uhr
        </p>
        <p className="mt-1 text-[0.9375rem]">
          In den letzten 24 Stunden: <b>{line.signups}</b> und <b>{line.payments}</b> · <b>{line.waiting.count}</b> {line.waiting.rest}.
        </p>
      </header>

      <div className="grid gap-6 min-[1360px]:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="adm-panel flex min-w-0 flex-col gap-[var(--gap,1rem)] lg:p-[var(--pad,1.25rem)]">
          <FocusCard summary={summary} tasks={views} allTotal={tasks.length} anomalies={anomalies} />

          <DailyPlan plan={plan} />

          <section aria-label="Die vier Zahlen" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-[0.9375rem] font-black">Die vier Zahlen</h2>
              <PeriodTabs current={period} />
            </div>
            {/* Two to a row on a phone as well: four full-width charts one under the other made "Heute" six screens long. */}
            <div className="grid grid-cols-2 gap-3 sm:gap-[var(--gap,1rem)] xl:grid-cols-4">
              {tiles.map((tile) => (
                <KpiTile
                  key={tile.key}
                  icon={KPI_ICONS[tile.key] ?? FiBarChart2}
                  label={tile.label}
                  value={tile.value}
                  delta={tile.delta}
                  series={tile.series}
                  previous={tile.previous}
                  hint={tile.hint}
                  href={tile.href}
                />
              ))}
            </div>
          </section>

          <Disclosure title="Mehr Details" hint="Alle Kennzahlen, Geld, Ziele, Marktplatz, Funnel, Ads, neue Nutzer und Zahlungen" storageKey="admin-heute-details">
            <Suspense fallback={<DetailsSkeleton />}>
              <HeuteDetails prefs={prefs} now={now} />
            </Suspense>
          </Disclosure>
        </div>

        <aside className="hidden min-[1360px]:block">
          <div className="sticky top-6">
            <Suspense fallback={<ColumnSkeleton />}>
              <HeuteColumn now={now} />
            </Suspense>
          </div>
        </aside>
      </div>
    </div>
  );
}
