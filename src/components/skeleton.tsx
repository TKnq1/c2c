export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700 ${className}`} />;
}

// A row shaped like the common "card with avatar + two text lines" pattern
// used across Requests/Feed/Discover/Payments/Favorites.
export function SkeletonCardRow() {
  return (
    <div className="rounded-2xl border border-ink/10 p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonCardList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCardRow key={i} />
      ))}
    </div>
  );
}
