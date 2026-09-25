import { Skeleton } from "@/components/skeleton";

// Mirrors the thread's real layout (see page.tsx) — chat-thread included, so
// main drops its padding on phones here too and nothing jumps when the
// actual page swaps in.
export default function Loading() {
  return (
    <div className="chat-thread flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-ink/10 px-2 pb-2 pt-[calc(var(--safe-top)+8px)] md:px-0 md:pb-3 md:pt-0">
        <div className="flex h-10 w-10 items-center justify-center">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 px-4 py-4 md:px-0">
        <Skeleton className="h-12 w-2/3 self-start rounded-[18px]" />
        <Skeleton className="h-10 w-1/2 self-end rounded-[18px]" />
        <Skeleton className="h-16 w-3/5 self-start rounded-[18px]" />
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-ink/10 px-3 pt-2 pb-[max(var(--safe-bottom),8px)] md:px-0 md:pt-3 md:pb-0">
        <Skeleton className="h-[42px] flex-1 rounded-[20px]" />
        <Skeleton className="h-[42px] w-[42px] rounded-full" />
      </div>
    </div>
  );
}
