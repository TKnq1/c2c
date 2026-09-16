import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-[75vh]">
      <div className="shrink-0">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center gap-3 mt-2">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col gap-3 py-4">
        <Skeleton className="h-12 w-2/3 rounded-2xl self-start" />
        <Skeleton className="h-10 w-1/2 rounded-2xl self-end" />
        <Skeleton className="h-16 w-3/5 rounded-2xl self-start" />
      </div>
      <Skeleton className="h-11 w-full rounded-lg shrink-0" />
    </div>
  );
}
