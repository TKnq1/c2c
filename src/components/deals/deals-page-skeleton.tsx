import { Skeleton } from "@/components/skeleton";

// The title with its line and the tab bar of the three Deals pages, as grey blocks. The title is only shown from md (see PageTitle).
export function DealsPageSkeletonHead() {
  return (
    <>
      <div className="flex flex-col gap-2 max-md:hidden">
        <Skeleton className="h-9 w-40 rounded" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded" />
    </>
  );
}
