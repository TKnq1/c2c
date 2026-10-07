import { Suspense } from "react";
import Link from "next/link";
import { FiSliders } from "react-icons/fi";
import { requireAdminSession } from "@/lib/admin-session";
import { getAdminPrefs } from "@/lib/admin-prefs-server";
import { FOCUS_SHOWN, focusSummary } from "@/lib/admin-focus";
import { loadKpis } from "@/lib/admin-kpis";
import { PERIODS, parsePeriod } from "@/lib/admin-period";
import { listOpenTasks } from "@/lib/admin-tasks";
import { Disclosure } from "@/components/admin/disclosure";
import { FocusCard } from "@/components/admin/focus-card";
import { HeuteDetails } from "@/components/admin/heute-details";
import { KpiTile } from "@/components/admin/dashboard-parts";
import { FilterTabs, firstParams } from "@/components/admin/list-controls";
import type { TaskView } from "@/components/admin/task-list";

const TIME_ZONE = "Europe/Berlin";

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("de-DE", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now));
  return hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
}

function DetailsSkeleton() {
  return (
    <div className="flex flex-col gap-[var(--gap,1rem)]" aria-busy="true" aria-label="Lädt">
      {[0, 1].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded border border-ink/10 bg-fog" />
      ))}
    </div>
  );
}

// "Heute" answers one question first: does anything need me? Below that come four figures on growth, and everything else
// waits behind "Mehr Details".
export default async function AdminTodayPage(props: PageProps<"/admin">) {
  const session = await requireAdminSession();
  const prefs = await getAdminPrefs(session.user.id);
  const now = new Date();
  const period = parsePeriod(firstParams(await props.searchParams).z);
  const [tiles, tasks] = await Promise.all([loadKpis({ now, period, prefs }), listOpenTasks(now)]);

  const summary = focusSummary(tasks);
  const views: TaskView[] = tasks
    .filter((t) => t.priority !== "LOW")
    .slice(0, FOCUS_SHOWN)
    .map((t) => ({ id: t.id, title: t.title, reason: t.reason, priority: t.priority, source: t.source, href: t.href }));

  const dateLabel = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE }).format(now);
  const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE }).format(now);
  const name = prefs.displayName ? `, ${prefs.displayName}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 pr-0 group-data-[panel=closed]/shell:lg:pr-28">
        <div>
          <h1 className="font-display text-title-1 font-black">Heute</h1>
          <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
            {greeting(now)}
            {name} · {dateLabel} · Stand {time} Uhr
          </p>
        </div>
        <Link href="/admin/anpassen" className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-3.5 py-1.5 text-xs font-bold transition hover:bg-fog">
          <FiSliders className="h-4 w-4" aria-hidden />
          Anpassen
        </Link>
      </div>

      <FocusCard summary={summary} tasks={views} allTotal={tasks.length} />

      <section aria-label="Die vier Zahlen" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterTabs
            path="/admin"
            params={{ z: String(period) }}
            name="z"
            options={PERIODS.map((p) => ({ value: String(p), label: p === 7 ? "7 Tage" : `${p} Tage` }))}
          />
        </div>
        <div className="grid gap-[var(--gap,1rem)] sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => (
            <KpiTile key={tile.key} label={tile.label} value={tile.value} delta={tile.delta} series={tile.series} previous={tile.previous} hint={tile.hint} href={tile.href} />
          ))}
        </div>
      </section>

      <Disclosure title="Mehr Details" hint="Alle Kennzahlen, Geld, Ziele, Marktplatz, Funnel, Ads, neue Nutzer und Zahlungen" storageKey="admin-heute-details">
        <Suspense fallback={<DetailsSkeleton />}>
          <HeuteDetails prefs={prefs} now={now} />
        </Suspense>
      </Disclosure>
    </div>
  );
}
