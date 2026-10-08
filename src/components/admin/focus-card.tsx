import Link from "next/link";
import { FiAlertTriangle, FiArrowRight, FiCheckCircle, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { LogoMark } from "@/components/admin/logo-mark";
import { TaskList, type TaskView } from "@/components/admin/task-list";
import type { focusSummary } from "@/lib/admin-focus";
import type { Anomaly } from "@/lib/admin-anomalies";

// The first thing on "Heute": one sentence on whether anything waits for the admin and, if so, the few most urgent tasks.
// The headline card carries the sentence, the card beside it the tasks and what stood out. The status always carries an
// icon and words, never colour alone.
export function FocusCard({ summary, tasks, allTotal, anomalies }: { summary: ReturnType<typeof focusSummary>; tasks: TaskView[]; allTotal: number; anomalies: Anomaly[] }) {
  const Icon = summary.tone === "calm" ? FiCheckCircle : FiAlertTriangle;
  const hasDetails = tasks.length > 0 || anomalies.length > 0;
  return (
    <section aria-label="Was jetzt ansteht" className={`grid gap-[var(--gap,1rem)] ${hasDetails ? "lg:grid-cols-[18.25rem_minmax(0,1fr)]" : ""}`}>
      <div className="adm-hero flex min-h-64 flex-col p-6">
        <LogoMark invert width={310} className="pointer-events-none absolute -right-20 -bottom-14 max-w-none opacity-[0.16] select-none" />
        <span className="relative grid h-[46px] w-[46px] place-items-center rounded-full bg-white/20">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="relative mt-4 font-display text-[1.875rem] leading-[1.08] font-black tracking-tight text-balance">{summary.headline}</h2>
        <p className="relative mt-1.5 text-[0.8125rem] text-white/90">{summary.sub}</p>
        {allTotal > 0 && (
          <Link
            href="/admin/offen"
            className="relative mt-5 inline-flex h-10 items-center gap-2 self-start rounded-[var(--adm-r-pill)] border border-white/20 bg-black/55 px-4 text-[0.8125rem] font-bold text-white transition hover:bg-black/70 lg:mt-auto"
          >
            {allTotal === 1 ? "Die Aufgabe ansehen" : `Alle ${allTotal} Aufgaben ansehen`}
            <FiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      {hasDetails && (
        <div className="adm-card flex min-w-0 flex-col p-[var(--pad,1.25rem)]">
          {tasks.length > 0 && <TaskList tasks={tasks} empty="" />}
          {anomalies.length > 0 && (
            <div className="mt-auto pt-4">
              <div className={tasks.length > 0 ? "border-t border-(--adm-line) pt-3.5" : ""}>
                <h3 className="mb-2 text-xs font-bold text-graphite">Aufgefallen</h3>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {anomalies.slice(0, 2).map((a) => {
                    const AnomalyIcon = a.tone === "down" ? FiTrendingDown : FiTrendingUp;
                    return (
                      <li key={a.key} className="flex items-center gap-2.5">
                        <AnomalyIcon className={`h-4 w-4 shrink-0 ${a.tone === "down" ? "text-[#d9970a]" : "text-[#0ca30c]"}`} aria-hidden />
                        <span>{a.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
