import { Skeleton, SkeletonTileGrid } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 min-w-48 rounded" />
        <Skeleton className="h-10 w-40 rounded" />
      </div>
      <Skeleton className="h-4 w-20" />
      <SkeletonTileGrid />
    </div>
  );
}
