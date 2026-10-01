import { Skeleton, SkeletonGroupList } from "@/components/skeleton";

// Search + Filter row, then the conversations as one grey group — the "Messages" heading
// lives in the navbar now, so none here.
export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-[42px] flex-1 rounded" />
        <Skeleton className="h-[42px] w-24 rounded" />
      </div>
      <SkeletonGroupList count={3} />
    </div>
  );
}
