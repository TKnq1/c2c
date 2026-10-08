import Link from "next/link";
import { FiAlertTriangle, FiCalendar, FiCheckCircle, FiChevronRight, FiClock, FiSun } from "react-icons/fi";
import { loadDeadlines, type Deadlines } from "@/lib/admin-deadlines";
import { listNotices } from "@/lib/admin-notices";
import { parseNoticeBody } from "@/lib/admin-notice-format";
import { shortAgo } from "@/lib/admin-today";
import { DecisionQuickAdd } from "@/components/admin/decision-quick-add";
import { money } from "@/components/admin/dashboard-parts";

const KIND_ICON = { DAILY: FiSun, WEEKLY: FiCalendar, URGENT: FiAlertTriangle } as const;
const SHOWN_DEADLINES = 3;
const SHOWN_NOTICES = 6;

type Due = { key: string; title: string; sub: string; href: string };

const ageText = (days: number) => (days <= 0 ? "heute" : days === 1 ? "1 Tag" : `${days} Tage`);
const dayText = (date: Date) => date.toLocaleDateString("de-DE", { day: "numeric", month: "short", timeZone: "Europe/Berlin" });

// What is due, most pressing first: frozen money, reports that sat too long, then the payments that release by themselves
// (those due today before the later ones). The same things the Fristen page lists, trimmed to what fits beside "Heute".
export function dueItems(d: Deadlines): Due[] {
  return [
    ...d.disputes.map((x) => ({ key: `dispute-${x.id}`, title: `Streitfall: ${x.title}`, sub: `${money(x.amountCents)} eingefroren · seit ${ageText(x.ageDays)}`, href: "/admin/moderation" })),
    ...d.reports.filter((r) => r.late).map((r) => ({ key: `report-${r.id}`, title: `Meldung zu ${r.about}`, sub: `${r.reason} · seit ${ageText(r.ageDays)} offen`, href: "/admin/moderation" })),
    ...[...d.releasing].sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.at.getTime() - b.at.getTime()).map((r) => ({
      key: `release-${r.id}`,
      title: `Freigabe: ${r.title}`,
      sub: `${money(r.amountCents)} · ${r.overdue ? "heute fällig" : `am ${dayText(r.at)}`}`,
      href: "/admin/payments",
    })),
  ];
}

// The column beside "Heute": what is due, the latest notices and a line to write a decision down.
export async function HeuteColumn({ now }: { now: Date }) {
  const [deadlines, notices] = await Promise.all([loadDeadlines(now), listNotices(SHOWN_NOTICES)]);
  const due = dueItems(deadlines).slice(0, SHOWN_DEADLINES);
  const [first, ...rest] = due;

  return (
    <div className="flex flex-col gap-7">
      <section>
        <h2 className="flex items-baseline justify-between font-display text-[1.3125rem] font-black tracking-tight">
          Fristen
          <Link href="/admin/fristen" className="text-[0.8125rem] font-bold text-(--accent-ink)">
            Alle
          </Link>
        </h2>
        {first ? (
          <div className="mt-3 flex flex-col gap-2">
            <Link href={first.href} className="flex min-h-16 items-center gap-3 rounded-[var(--adm-r-row)] bg-accent py-3 pr-3.5 pl-2.5 text-on-accent">
              <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-black/15">
                <FiClock className="h-[22px] w-[22px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-[0.9375rem] leading-5 font-bold">{first.title}</span>
                <span className="line-clamp-2 block text-[0.8125rem] opacity-85">{first.sub}</span>
              </span>
              <FiChevronRight className="h-5 w-5 shrink-0" aria-hidden />
            </Link>
            {rest.map((item) => (
              <Link key={item.key} href={item.href} className="adm-row flex items-center gap-3 px-3.5 py-2.5 transition hover:bg-ink/5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{item.title}</span>
                  <span className="block truncate text-xs text-neutral-600 dark:text-neutral-400">{item.sub}</span>
                </span>
                <FiChevronRight className="h-4 w-4 shrink-0 text-graphite" aria-hidden />
              </Link>
            ))}
          </div>
        ) : (
          <p className="adm-row mt-3 flex items-center gap-2.5 px-4 py-3.5 text-sm">
            <FiCheckCircle className="h-[18px] w-[18px] shrink-0 text-(--accent-ink)" aria-hidden />
            Keine Frist in Sicht.
          </p>
        )}
      </section>

      <section>
        <h2 className="flex items-baseline justify-between font-display text-[1.3125rem] font-black tracking-tight">
          Mitteilungen
          <Link href="/admin/mitteilungen" className="text-[0.8125rem] font-bold text-(--accent-ink)">
            Alle ansehen
          </Link>
        </h2>
        {notices.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">Noch nichts da. Der erste Tagesbericht erscheint am Morgen.</p>
        ) : (
          <ul className="mt-2">
            {notices.map((n) => {
              const Icon = KIND_ICON[n.kind];
              const first = parseNoticeBody(n.body)[0];
              const summary = first?.lines[0] ?? first?.title ?? "";
              const unread = n.readAt === null;
              return (
                <li key={n.id}>
                  <Link href={n.href ?? "/admin/mitteilungen"} className="group flex items-center gap-3.5 py-2.5">
                    <span
                      className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full ${n.kind === "URGENT" ? "bg-[#d03b3b]/15 text-[#d03b3b] dark:text-[#ff7f8a]" : "bg-(--accent-soft) text-(--accent-ink)"}`}
                    >
                      <Icon className="h-[19px] w-[19px]" aria-hidden />
                      {unread && <span className="absolute top-0 right-0 h-[11px] w-[11px] rounded-full border-2 border-(--adm-window) bg-accent" aria-label="ungelesen" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9375rem] leading-5 font-bold group-hover:underline">{n.title}</span>
                      {summary && <span className="block truncate text-[0.8125rem] text-neutral-600 dark:text-neutral-400">{summary}</span>}
                    </span>
                    <span className="shrink-0 self-start pt-1 text-[0.6875rem] text-neutral-500 tabular-nums">{shortAgo(n.createdAt, now)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-[1.3125rem] font-black tracking-tight">Entscheidung notieren</h2>
        <div className="mt-3">
          <DecisionQuickAdd />
        </div>
      </section>
    </div>
  );
}
