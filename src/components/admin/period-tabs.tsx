import Link from "next/link";
import { PERIODS, periodWords, type Period } from "@/lib/admin-period";

// 7, 30 or 90 days for the four figures on "Heute": plain links (?z=), the chosen one underlined in the accent.
export function PeriodTabs({ current }: { current: Period }) {
  return (
    <nav aria-label="Zeitraum" className="flex gap-6 text-sm font-bold">
      {PERIODS.map((p) => (
        <Link
          key={p}
          href={`/admin?z=${p}`}
          scroll={false}
          aria-current={p === current ? "true" : undefined}
          className={`border-b-2 pb-1.5 transition ${p === current ? "border-accent text-(--accent-ink)" : "border-transparent text-graphite hover:text-ink"}`}
        >
          {periodWords(p).short}
        </Link>
      ))}
    </nav>
  );
}
