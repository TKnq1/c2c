import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { TaskList, type TaskView } from "@/components/admin/task-list";
import type { focusSummary } from "@/lib/admin-focus";
import type { Anomaly } from "@/lib/admin-anomalies";

const TONE = {
  calm: { Icon: FiCheckCircle, color: "text-[#0ca30c]", ring: "bg-[#0ca30c]/12" },
  medium: { Icon: FiAlertTriangle, color: "text-[#d9970a]", ring: "bg-[#d9970a]/12" },
  high: { Icon: FiAlertTriangle, color: "text-[#d03b3b]", ring: "bg-[#d03b3b]/12" },
} as const;

// The first thing on "Heute": one sentence on whether anything waits for the admin and, if so, the few most urgent tasks.
// The status always carries an icon and words, never colour alone.
export function FocusCard({ summary, tasks, allTotal, anomalies }: { summary: ReturnType<typeof focusSummary>; tasks: TaskView[]; allTotal: number; anomalies: Anomaly[] }) {
  const { Icon, color, ring } = TONE[summary.tone];
  const more = allTotal - tasks.length;
  return (
    <section aria-label="Was jetzt ansteht" className="rounded border border-ink/10 bg-paper p-[var(--pad,1.25rem)]">
      <div className="flex items-center gap-3.5">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${ring} ${color}`}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[1.625rem] leading-8 font-black tracking-tight">{summary.headline}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{summary.sub}</p>
        </div>
      </div>
      {tasks.length > 0 && (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <TaskList tasks={tasks} empty="" />
        </div>
      )}
      {anomalies.length > 0 && (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <h3 className="mb-2 text-xs font-bold text-graphite">Aufgefallen</h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {anomalies.slice(0, 2).map((a) => {
              const Icon = a.tone === "down" ? FiTrendingDown : FiTrendingUp;
              return (
                <li key={a.key} className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${a.tone === "down" ? "text-[#d9970a]" : "text-[#0ca30c]"}`} aria-hidden />
                  <span>{a.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {more > 0 && (
        <p className="mt-3 text-sm">
          <Link href="/admin/offen" className="font-bold underline underline-offset-2">
            {tasks.length > 0 ? `Alle ${allTotal} Aufgaben ansehen` : `${more === 1 ? "Die Aufgabe" : `Die ${more} Aufgaben`} ansehen`}
          </Link>
        </p>
      )}
    </section>
  );
}
