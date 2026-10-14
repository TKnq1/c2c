import { Skeleton, SkeletonCardList, SkeletonPaymentStats } from "@/components/skeleton";
import { DealsPageSkeletonHead } from "@/components/deals/deals-page-skeleton";

// Same container and head as the page (and as the deals and invoices pages beside it), so the page does not shift while it loads.
export default function Loading() {
  return (
    <div className="page-wide flex flex-col gap-6">
      <DealsPageSkeletonHead />
      <SkeletonPaymentStats />
      <Skeleton className="h-12 rounded" />
      <SkeletonCardList count={3} />
    </div>
  );
}
