import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { DashCard, PageHeader } from "@/components/admin/dashboard-parts";
import { ListSearch, firstParams } from "@/components/admin/list-controls";
import { DecisionForm, DeleteDecisionButton } from "@/components/admin/log-forms";
import { LocalDate } from "@/components/local-date";

export const metadata = { title: "Entscheidungs-Log" };

const PATH = "/admin/log";

export default async function AdminLogPage(props: PageProps<"/admin/log">) {
  await requireAdminSession();
  const params = firstParams(await props.searchParams);
  const q = params.q?.trim();
  const entries = await prisma.decisionLog.findMany({
    where: q
      ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { decision: { contains: q, mode: "insensitive" } }, { reason: { contains: q, mode: "insensitive" } }] }
      : undefined,
    orderBy: [{ decidedOn: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Entscheidungs-Log"
        sub="Warum ist etwas so, wie es ist? Halte fest, was du entschieden hast und warum, damit du es in einem halben Jahr nicht neu herleiten musst."
        right={<ListSearch path={PATH} params={params} placeholder="Im Log suchen" />}
      />

      <DashCard title="Neue Entscheidung">
        <DecisionForm />
      </DashCard>

      <DashCard title="Einträge" right={q ? `${entries.length} Treffer für „${q}“` : `${entries.length}`}>
        {entries.length === 0 ? (
          <p className="text-sm text-neutral-500">{q ? "Nichts gefunden." : "Noch kein Eintrag."}</p>
        ) : (
          <ol className="flex flex-col">
            {entries.map((e) => (
              <li key={e.id} className="border-t border-ink/10 py-4 first:border-t-0 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500">
                      <LocalDate ms={e.decidedOn.getTime()} locale="de-DE" />
                    </p>
                    <h2 className="font-bold">{e.title}</h2>
                  </div>
                  <DeleteDecisionButton id={e.id} title={e.title} />
                </div>
                <p className="mt-1 text-sm whitespace-pre-line">{e.decision}</p>
                {e.reason && <p className="mt-1 text-sm whitespace-pre-line text-neutral-600 dark:text-neutral-400">Warum: {e.reason}</p>}
              </li>
            ))}
          </ol>
        )}
      </DashCard>
    </div>
  );
}
