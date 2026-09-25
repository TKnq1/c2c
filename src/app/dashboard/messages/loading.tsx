import { Skeleton, SkeletonCardList } from "@/components/skeleton";

// Search + Filter row, then conversation cards — the "Messages" heading
// lives in the navbar now, so none here.
export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-[42px] flex-1 rounded-[14px]" />
        <Skeleton className="h-[42px] w-24 rounded-[14px]" />
      </div>
      <SkeletonCardList count={3} />
    </div>
  );
}
