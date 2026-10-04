import { Stars } from "@/components/stars";
import { RelativeTime } from "@/components/relative-time";
import { getT } from "@/lib/i18n/server";

type ReviewEntry = { id: string; rating: number; comment: string | null; createdAt: Date };

export async function ReviewsList({ reviews }: { reviews: ReviewEntry[] }) {
  const t = await getT();
  if (reviews.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("screens.ui.noReviews")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded bg-fog p-3">
          <div className="flex items-center gap-2">
            <Stars rating={r.rating} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              <RelativeTime ms={r.createdAt.getTime()} />
            </span>
          </div>
          {r.comment && <p className="text-sm text-neutral-700 mt-1 dark:text-neutral-300">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
