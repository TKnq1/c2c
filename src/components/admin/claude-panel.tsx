import Link from "next/link";
import { FiCpu, FiSend } from "react-icons/fi";
import { TaskList, type TaskView } from "@/components/admin/task-list";

// The right-hand panel: Claude's briefing and chat, and the Offen list. Briefing and chat arrive with the Claude
// packages; until then the panel says so plainly instead of showing something that does nothing.
export function ClaudePanel({ tasks, apiKeySet }: { tasks: TaskView[]; apiKeySet: boolean }) {
  return (
    <>
      <div className="flex items-center gap-2.5 pr-9">
        <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-accent text-on-accent">
          <FiCpu className="h-4 w-4" aria-hidden />
        </span>
        <p className="font-display text-base font-black">Claude</p>
      </div>

      <div className="rounded border border-ink/10 bg-paper p-3.5 text-sm leading-[21px]">
        {apiKeySet ? (
          <p>Der API-Key ist eingetragen. Briefing und Chat werden als Nächstes freigeschaltet.</p>
        ) : (
          <p>
            Claude ist noch nicht verbunden. Sobald der API-Key in Vercel eingetragen ist, schreibt Claude dir hier jeden Morgen ein Briefing und
            beantwortet deine Fragen.
          </p>
        )}
        <Link href="/admin/anpassen#verbindungen" className="mt-2 inline-block text-xs underline">
          Verbindungen ansehen
        </Link>
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="flex items-center justify-between text-xs font-bold text-graphite">
          <span>Offen</span>
          <span className="font-normal">{tasks.length}</span>
        </h2>
        <div className="rounded border border-ink/10 bg-paper px-3.5 py-3">
          <TaskList tasks={tasks.slice(0, 5)} compact empty="Nichts offen. Gut so." />
        </div>
        {tasks.length > 5 && (
          <Link href="/admin/offen" className="text-xs underline">
            Alle {tasks.length} ansehen
          </Link>
        )}
      </section>

      <div className="mt-auto flex items-center gap-2 rounded-full border border-ink/10 bg-paper py-1.5 pr-1.5 pl-4 text-sm text-graphite opacity-60" aria-disabled>
        <span className="flex-1">Frag Claude oder schreib eine Aufgabe …</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-paper">
          <FiSend className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </>
  );
}
