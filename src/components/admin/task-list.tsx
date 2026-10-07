"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FiAlertTriangle, FiChevronRight, FiClock, FiCpu, FiMinus, FiTool, FiUser, FiX } from "react-icons/fi";
import { deleteTaskAction, markTaskDoneAction, snoozeTaskAction } from "@/lib/actions/admin-dashboard";
import { toast } from "@/lib/toast";

export type TaskView = {
  id: string;
  title: string;
  reason: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  source: "CHECK" | "CLAUDE" | "MANUAL";
  href: string | null;
};

const PRIORITY = {
  HIGH: { label: "Hoch", color: "text-[#d03b3b]", Icon: FiAlertTriangle },
  MEDIUM: { label: "Mittel", color: "text-[#d9970a]", Icon: FiAlertTriangle },
  LOW: { label: "Niedrig", color: "text-graphite", Icon: FiMinus },
} as const;

const SOURCE = {
  CHECK: { label: "Prüfung", Icon: FiTool },
  CLAUDE: { label: "Claude", Icon: FiCpu },
  MANUAL: { label: "Von dir", Icon: FiUser },
} as const;

// The open tasks with their buttons. A ticked task leaves the list at once and the server catches up behind it;
// "Später" hides it for 1, 3 or 7 days. Priority always has an icon and a word, never colour alone.
export function TaskList({ tasks, compact = false, empty }: { tasks: TaskView[]; compact?: boolean; empty: string }) {
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const visible = tasks.filter((t) => !gone.has(t.id));

  const run = (id: string, action: () => Promise<{ error?: string }>) => {
    setGone((prev) => new Set(prev).add(id));
    setMenu(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        setGone((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  if (visible.length === 0) return <p className="text-sm text-neutral-500">{empty}</p>;

  return (
    <ul className="flex flex-col">
      {visible.map((task) => {
        const priority = PRIORITY[task.priority];
        const source = SOURCE[task.source];
        return (
          <li key={task.id} className="relative flex items-start gap-3 border-t border-ink/10 py-3 first:border-t-0 first:pt-0">
            <button
              type="button"
              aria-label={`Erledigt: ${task.title}`}
              onClick={() => run(task.id, () => markTaskDoneAction(task.id))}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[4px] border-[1.5px] border-stone transition hover:border-accent hover:bg-accent/15"
            />
            <div className="min-w-0 flex-1">
              <p className={`font-bold ${compact ? "text-sm leading-[19px]" : "text-[0.9375rem] leading-5"}`}>{task.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                <span className={`inline-flex items-center gap-1 font-bold ${priority.color}`}>
                  <priority.Icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="text-neutral-700 dark:text-neutral-300">{priority.label}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-fog px-2 py-px text-[0.6875rem]">
                  <source.Icon className="h-3 w-3" aria-hidden />
                  {source.label}
                </span>
                {task.reason && !compact && <span>{task.reason}</span>}
              </p>
              {task.reason && compact && <p className="mt-1 text-xs text-neutral-500">{task.reason}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-0.5 text-graphite">
              <button
                type="button"
                aria-label="Später erinnern"
                aria-expanded={menu === task.id}
                onClick={() => setMenu(menu === task.id ? null : task.id)}
                className="rounded p-1.5 transition hover:bg-fog hover:text-ink"
              >
                <FiClock className="h-4 w-4" aria-hidden />
              </button>
              {task.source === "MANUAL" && (
                <button
                  type="button"
                  aria-label="Aufgabe löschen"
                  onClick={() => run(task.id, () => deleteTaskAction(task.id))}
                  className="rounded p-1.5 transition hover:bg-fog hover:text-ink"
                >
                  <FiX className="h-4 w-4" aria-hidden />
                </button>
              )}
              {task.href && (
                <Link href={task.href} aria-label="Öffnen" className="rounded p-1.5 transition hover:bg-fog hover:text-ink">
                  <FiChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
            {menu === task.id && (
              <div className="absolute top-9 right-0 z-10 flex flex-col rounded border border-ink/10 bg-paper py-1 text-sm shadow-lg">
                {[1, 3, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => run(task.id, () => snoozeTaskAction(task.id, days))}
                    className="px-4 py-1.5 text-left transition hover:bg-fog"
                  >
                    {days === 1 ? "Morgen wieder" : `In ${days} Tagen wieder`}
                  </button>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
