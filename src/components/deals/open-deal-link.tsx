import Link from "next/link";
import { IoBriefcaseOutline } from "react-icons/io5";

// From a payment row to the brand deal behind it, which is where the work, the checks and the payout of that collab live.
export function OpenDealLink({ dealId, label }: { dealId: string; label: string }) {
  return (
    <Link
      href={`/dashboard/deals/${dealId}`}
      className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium transition hover:border-neutral-400 no-print dark:border-neutral-700"
    >
      <IoBriefcaseOutline className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
