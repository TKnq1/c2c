import { Skeleton, SkeletonCardList, SkeletonPaymentStats } from "@/components/skeleton";

// Same order as the page: summary, the payouts card, then rows.
export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <SkeletonPaymentStats />
      <Skeleton className="h-12 rounded-[20px]" />
      <SkeletonCardList count={3} />
    </div>
  );
}
