import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { buildFunnel, type FunnelRow } from "@/lib/onboarding-flow";
import { StatTile } from "@/components/admin/stat-tile";
import { HEARD_FROM } from "@/lib/heard-from";

const HEARD_LABELS: Record<(typeof HEARD_FROM)[number], string> = {
  search: "Search engine",
  social: "Social media",
  friend: "A friend or colleague",
  community: "A forum or community",
  newsletter: "A newsletter or blog",
  event: "An event",
  other: "Somewhere else",
};

// Where people leave the onboarding wizard. Counted from OnboardingEvent
// (one row per person, step and outcome), so the numbers start from the day
// that table did.
export default async function AdminOnboardingPage() {
  await requireAdminSession();

  let groups: { role: string; step: string; kind: string; count: number }[] | null = null;
  try {
    const rows = await prisma.onboardingEvent.groupBy({ by: ["role", "step", "kind"], _count: { _all: true } });
    groups = rows.map((r) => ({ role: r.role, step: r.step, kind: r.kind, count: r._count._all }));
  } catch {
    // The table isn't in this database yet (a preview deploy before the migration ran).
  }

  // The optional "How did you hear about us?" on the last screen. Accounts that skipped it, or were created
  // before it existed, are counted apart.
  let heard: { answer: string; count: number }[] | null = null;
  let withoutAnswer = 0;
  try {
    const rows = await prisma.user.groupBy({
      by: ["heardFrom"],
      where: { deletedAt: null, role: { in: ["CREATOR", "STARTUP"] } },
      _count: { _all: true },
    });
    withoutAnswer = rows.find((r) => r.heardFrom === null)?._count._all ?? 0;
    heard = rows
      .filter((r): r is typeof r & { heardFrom: string } => r.heardFrom !== null)
      .map((r) => ({ answer: r.heardFrom, count: r._count._all }))
      .sort((a, b) => b.count - a.count);
  } catch {
    // The column isn't in this database yet.
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-title-1 font-bold">Onboarding</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          How far people get through the setup wizard after signing up. &ldquo;Dropped out&rdquo; is a step someone
          saw but neither finished nor skipped (yet). Payouts and notifications only show up where they can work.
        </p>
      </div>

      {groups === null ? (
        <p className="rounded bg-fog p-4 text-sm text-neutral-600 dark:text-neutral-400">
          No data yet: the onboarding events table isn&apos;t in this database. Run <code>npm run db:deploy</code>.
        </p>
      ) : (
        <>
          <Funnel title="Creators" rows={buildFunnel("CREATOR", groups.filter((g) => g.role === "CREATOR"))} />
          <Funnel title="Brands" rows={buildFunnel("STARTUP", groups.filter((g) => g.role === "STARTUP"))} />
        </>
      )}

      {heard !== null && <HeardFrom rows={heard} withoutAnswer={withoutAnswer} />}
    </div>
  );
}

function HeardFrom({ rows, withoutAnswer }: { rows: { answer: string; count: number }[]; withoutAnswer: number }) {
  const answered = rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-title-2 font-bold">How people heard about us</h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        The optional question on the last onboarding screen. {answered} answered, {withoutAnswer} didn&apos;t (or signed
        up before it existed).
      </p>
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded bg-fog">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.answer} className="border-t border-ink/10 tabular-nums first:border-t-0">
                  <td className="px-4 py-2.5 font-sans">{HEARD_LABELS[r.answer as keyof typeof HEARD_LABELS] ?? r.answer}</td>
                  <td className="px-4 py-2.5 text-right">{r.count}</td>
                  <td className="px-4 py-2.5 text-right text-neutral-500 dark:text-neutral-400">
                    {Math.round((r.count / answered) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Funnel({ title, rows }: { title: string; rows: FunnelRow[] }) {
  const started = rows[0]?.viewed ?? 0;
  const finished = rows.find((r) => r.key === "done")?.viewed ?? 0;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-title-2 font-bold">{title}</h2>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Started" value={String(started)} />
        <StatTile label="Reached the end" value={String(finished)} />
        <StatTile label="Completion" value={started > 0 ? `${Math.round((finished / started) * 100)}%` : "–"} />
      </div>
      <div className="overflow-x-auto rounded bg-fog">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="text-left text-footnote text-neutral-500 dark:text-neutral-400">
              <th className="px-4 py-2.5 font-medium">Step</th>
              <th className="px-4 py-2.5 text-right font-medium">Viewed</th>
              <th className="px-4 py-2.5 text-right font-medium">Completed</th>
              <th className="px-4 py-2.5 text-right font-medium">Skipped</th>
              <th className="px-4 py-2.5 text-right font-medium">Dropped out</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-ink/10 tabular-nums">
                <td className="px-4 py-2.5 font-sans">{r.label}</td>
                <td className="px-4 py-2.5 text-right">{r.viewed}</td>
                <td className="px-4 py-2.5 text-right">{r.key === "done" ? "–" : r.completed}</td>
                <td className="px-4 py-2.5 text-right">{r.skipped || "–"}</td>
                <td className={`px-4 py-2.5 text-right ${r.droppedOut > 0 ? "font-semibold" : ""}`}>
                  {r.key === "done" ? "–" : r.droppedOut}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
