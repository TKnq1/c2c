import { SkeletonCardList } from "@/components/skeleton";
import { DealsPageSkeletonHead } from "@/components/deals/deals-page-skeleton";

// Same container and head as the page, so moving between Deals, Payments and Invoices does not shift anything.
export default function Loading() {
  return (
    <div className="page-wide flex flex-col gap-6 pb-8">
      <DealsPageSkeletonHead />
      <SkeletonCardList count={3} />
    </div>
  );
}
