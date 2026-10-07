import Link from "next/link";
import { FiCpu } from "react-icons/fi";
import { TaskList, type TaskView } from "@/components/admin/task-list";

// The right-hand panel. Claude's briefing and chat are not built: they run through the Claude API, which is billed per
// use and not part of the Pro plan, so they wait on the Offen list until that is wanted. The panel says so plainly
// and keeps the Offen list in view.
export function ClaudePanel({ tasks }: { tasks: TaskView[] }) {
  return (
    <>
      <div className="flex items-center gap-2.5 pr-9">
        <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-accent text-on-accent">
          <FiCpu className="h-4 w-4" aria-hidden />
        </span>
        <p className="font-display text-base font-black">Offen</p>
      </div>

      <div className="rounded border border-ink/10 bg-paper p-3.5 text-sm leading-[21px]">
        <p>
          Briefing und Chat mit Claude sind noch nicht gebaut. Sie laufen über die Claude-API (Kosten pro Nutzung) und gehören nicht zum Pro-Abo.
        </p>
        <Link href="/admin/offen" className="mt-2 inline-block text-xs underline">
          In der Liste ansehen
        </Link>
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="flex items-center justify-between text-xs font-bold text-graphite">
          <span>Aufgaben</span>
          <span className="font-normal">{tasks.length}</span>
        </h2>
        <div className="rounded border border-ink/10 bg-paper px-3.5 py-3">
          <TaskList tasks={tasks.slice(0, 6)} compact empty="Nichts offen. Gut so." />
        </div>
        {tasks.length > 6 && (
          <Link href="/admin/offen" className="text-xs underline">
            Alle {tasks.length} ansehen
          </Link>
        )}
      </section>
    </>
  );
}
