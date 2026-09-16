import { Stars } from "@/components/stars";

type ReviewEntry = { id: string; rating: number; comment: string | null; createdAt: Date };

export function ReviewsList({ reviews }: { reviews: ReviewEntry[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">No reviews yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-ink/10 p-3">
          <div className="flex items-center gap-2">
            <Stars rating={r.rating} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{r.createdAt.toLocaleDateString("en-US")}</span>
          </div>
          {r.comment && <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
