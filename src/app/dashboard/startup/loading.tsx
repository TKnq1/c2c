import { Skeleton, SkeletonCardList } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-9 w-32 rounded" />
      </div>
      <SkeletonCardList count={5} />
    </div>
  );
}
