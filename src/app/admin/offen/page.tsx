import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { listOpenTasks } from "@/lib/admin-tasks";
import { DashCard } from "@/components/admin/dashboard-parts";
import { TaskList } from "@/components/admin/task-list";
import { NewTaskForm, ReopenButton } from "@/components/admin/task-forms";
import { LocalDate } from "@/components/local-date";

const DAY = 24 * 60 * 60 * 1000;

export const metadata = { title: "Offen" };

export default async function AdminTasksPage() {
  await requireAdminSession();
  const now = new Date();
  const [open, snoozed, done] = await Promise.all([
    listOpenTasks(now),
    prisma.adminTask.findMany({ where: { status: "SNOOZED", snoozedUntil: { gt: now } }, orderBy: { snoozedUntil: "asc" } }),
    prisma.adminTask.findMany({ where: { status: "DONE", doneAt: { gte: new Date(now.getTime() - 14 * DAY) } }, orderBy: { doneAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-title-1 font-black">Offen</h1>
        <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
          Alles, was auf dich wartet. Prüfungen schreiben sich selbst und schließen sich, wenn die Ursache weg ist.
        </p>
      </div>

      <DashCard title="Neue Aufgabe">
        <NewTaskForm />
      </DashCard>

      <DashCard title="Offen" right={`${open.length}`}>
        <TaskList
          tasks={open.map((t) => ({ id: t.id, title: t.title, reason: t.reason, priority: t.priority, source: t.source, href: t.href }))}
          empty="Nichts offen. Gut so."
        />
      </DashCard>

      {snoozed.length > 0 && (
        <DashCard title="Zurückgestellt" right={`${snoozed.length}`}>
          <ul>
            {snoozed.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 border-t border-ink/10 py-2.5 text-sm first:border-t-0 first:pt-0">
                <span className="min-w-0 truncate">{t.title}</span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-neutral-500">
                  wieder am {t.snoozedUntil && <LocalDate ms={t.snoozedUntil.getTime()} locale="de-DE" />}
                  <ReopenButton id={t.id} />
                </span>
              </li>
            ))}
          </ul>
        </DashCard>
      )}

      {done.length > 0 && (
        <DashCard title="Erledigt" right="letzte 14 Tage">
          <ul>
            {done.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 border-t border-ink/10 py-2.5 text-sm first:border-t-0 first:pt-0">
                <span className="min-w-0 truncate text-neutral-600 line-through decoration-neutral-400 dark:text-neutral-400">{t.title}</span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-neutral-500">
                  {t.doneAt && <LocalDate ms={t.doneAt.getTime()} locale="de-DE" />}
                  <ReopenButton id={t.id} />
                </span>
              </li>
            ))}
          </ul>
        </DashCard>
      )}
    </div>
  );
}
