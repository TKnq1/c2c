"use client";

import { useEffect, useState } from "react";
import { eurosToCents } from "@/lib/compliance/briefing-helpers";
import { formatCents } from "@/lib/format";
import { POST_FORMATS, type PostFormat } from "@/lib/social/platforms";
import { PlatformIcon } from "@/components/platform-icons";
import { cardClass, inputClass } from "@/components/deals/ui";
import { useDealText } from "@/components/deals/use-deal-text";

// A calculator next to the chosen formats: what each one is worth, the sum, and how that sits against the request's budget. It is not
// part of the briefing or the contract (the price is set in the offer), so it is kept only in this browser, per request.
export function BudgetSplit({ requestId, formats, budgetCents }: { requestId: string; formats: PostFormat[]; budgetCents: number | null }) {
  const u = useDealText();
  const key = `briefing-budget:${requestId}`;
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      // After mount, so the server's render and the first client render agree.
      if (stored) queueMicrotask(() => setAmounts(JSON.parse(stored) as Record<string, string>));
    } catch {
      // No storage is fine: the numbers are just not remembered.
    }
  }, [key]);

  const change = (code: string, value: string) =>
    setAmounts((prev) => {
      const next = { ...prev, [code]: value };
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // See above.
      }
      return next;
    });

  if (formats.length === 0) return null;
  const planned = formats.reduce((sum, f) => sum + eurosToCents(amounts[f]), 0);
  const over = budgetCents !== null && planned > budgetCents;
  const share = budgetCents ? Math.min(100, Math.round((planned / budgetCents) * 100)) : 0;

  return (
    <div className={`${cardClass} flex flex-col gap-3 bg-paper ring-1 ring-ink/10`}>
      <div>
        <p className="text-sm font-medium">{u("briefing.budget.title")}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{u("briefing.budget.hint")}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {formats.map((f) => (
          <li key={f} className="flex items-center gap-3">
            <PlatformIcon platform={POST_FORMATS[f].platform} className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate text-sm">{POST_FORMATS[f].label}</span>
            <div className="relative w-28 shrink-0">
              <input inputMode="decimal" value={amounts[f] ?? ""} onChange={(e) => change(f, e.target.value)} aria-label={POST_FORMATS[f].label} className={`${inputClass} pr-7 text-right tabular-nums`} />
              <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-neutral-500">€</span>
            </div>
          </li>
        ))}
      </ul>
      {planned > 0 && (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          {budgetCents !== null && (
            <div className="h-2 overflow-hidden rounded-full bg-ink/10">
              <div className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${over ? "bg-ink" : "bg-accent"}`} style={{ width: `${share}%` }} />
            </div>
          )}
          <p className="text-sm font-medium tabular-nums">
            {budgetCents !== null ? u("briefing.budget.total", { planned: formatCents(planned), budget: formatCents(budgetCents) }) : formatCents(planned)}
            {budgetCents !== null && (
              <span className="ml-2 font-normal text-neutral-500 dark:text-neutral-400">
                {over ? u("briefing.budget.over", { amount: formatCents(planned - budgetCents) }) : u("briefing.budget.left", { amount: formatCents(budgetCents - planned) })}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
