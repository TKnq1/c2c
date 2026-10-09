"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshOpenOffersAction } from "@/lib/actions/payments";
import { toast } from "@/lib/toast";
import { cardClass, primaryButton } from "@/components/deals/ui";
import { useDealText } from "@/components/deals/use-deal-text";

// A changed briefing puts the brand's open offers on that request on hold: the creator sees the new rules only once the offer is
// confirmed again. Says how many wait, with the button that does it for all of them.
export function ReconfirmOffers({ requestId, count }: { requestId: string; count: number }) {
  const u = useDealText();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (count <= 0) return null;
  return (
    <div className={`${cardClass} flex flex-col gap-3 text-sm`} role="status">
      <p>{count === 1 ? u("briefing.stale.one") : u("briefing.stale.many", { count })}</p>
      <button
        type="button"
        disabled={pending}
        className={`${primaryButton} w-fit`}
        onClick={() =>
          startTransition(async () => {
            const result = await refreshOpenOffersAction(requestId).catch(() => ({ error: u("form.somethingWrong") }));
            if ("error" in result) {
              toast.error(result.error);
              return;
            }
            toast.success(result.count === 1 ? u("briefing.stale.done.one") : u("briefing.stale.done.many", { count: result.count }));
            router.refresh();
          })
        }
      >
        {pending ? u("form.working") : u("briefing.stale.action")}
      </button>
    </div>
  );
}
