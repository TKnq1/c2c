"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { FiCheck, FiChevronRight } from "react-icons/fi";
import { toggleRoutineAction } from "@/lib/actions/admin-dashboard";
import type { DailyPlan as Plan } from "@/lib/admin-routines-server";
import { toast } from "@/lib/toast";

// The daily plan under "Was jetzt ansteht": the fixed habits for content, outreach and the numbers, ticked off per
// day, with how much of today is done and how many days in a row everything was.
export function DailyPlan({ plan }: { plan: Plan }) {
  const [, startTransition] = useTransition();
  const [ticked, setTicked] = useOptimistic(
    new Set(plan.groups.flatMap((g) => g.items.filter((i) => i.done).map((i) => i.key))),
    (current: Set<string>, change: { key: string; done: boolean }) => {
      const next = new Set(current);
      if (change.done) next.add(change.key);
      else next.delete(change.key);
      return next;
    },
  );

  const toggle = (key: string, done: boolean) =>
    startTransition(async () => {
      setTicked({ key, done });
      const result = await toggleRoutineAction(key, done);
      if (result.error) toast.error(result.error);
    });

  const done = ticked.size;
  const percent = plan.total ? Math.round((done / plan.total) * 100) : 0;

  return (
    <section aria-label="Tagesplan" className="rounded border border-ink/10 bg-paper p-[var(--pad,1.25rem)]">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-title-3 font-black">Tagesplan</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {done === plan.total ? "Alles erledigt für heute." : `${done} von ${plan.total} erledigt`}
          </p>
        </div>
        {plan.streak > 0 && (
          <p className="text-sm font-bold">
            🔥 {plan.streak} {plan.streak === 1 ? "Tag" : "Tage"} in Folge alles erledigt
          </p>
        )}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fog" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Fortschritt heute">
        <div className="h-full rounded-full bg-ink transition-[width]" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        {plan.groups.map((group) => (
          <div key={group.area} className="min-w-0">
            <h3 className="mb-2 text-xs font-bold text-graphite">{group.title}</h3>
            <ul className="flex flex-col">
              {group.items.map((item) => {
                const on = ticked.has(item.key);
                return (
                  <li key={item.key} className="flex items-start gap-3 border-t border-ink/10 py-2.5 first:border-t-0 first:pt-0">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      aria-label={item.label}
                      onClick={() => toggle(item.key, !on)}
                      className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] border-[1.5px] transition ${
                        on ? "border-ink bg-ink text-paper" : "border-stone hover:border-ink"
                      }`}
                    >
                      {on && <FiCheck className="h-3 w-3" aria-hidden />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-5 ${on ? "text-neutral-500 line-through" : "font-bold"}`}>{item.label}</p>
                      {item.detail && <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">{item.detail}</p>}
                    </div>
                    {item.href && (
                      <Link href={item.href} aria-label={`Öffnen: ${item.label}`} className="mt-0.5 shrink-0 text-neutral-500 hover:text-ink">
                        <FiChevronRight className="h-4 w-4" aria-hidden />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
