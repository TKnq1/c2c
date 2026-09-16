"use client";

import { useActionState, useState } from "react";
import { reportUserAction, blockUserAction, unblockUserAction } from "@/lib/actions/moderation";
import { TextareaWithCounter } from "@/components/textarea-with-counter";
import { toast } from "@/lib/toast";

const REASONS = ["Spam", "Harassment or abuse", "Scam or fraud", "Inappropriate content", "Other"];

export function ReportBlockActions({
  otherUserId,
  initialBlocked,
}: {
  otherUserId: string;
  initialBlocked: boolean;
}) {
  const [showReport, setShowReport] = useState(false);
  const [reportState, reportFormAction, reportPending] = useActionState(
    reportUserAction.bind(null, otherUserId),
    undefined,
  );
  const [blocked, setBlocked] = useState(initialBlocked);
  const [blockPending, setBlockPending] = useState(false);

  const toggleBlock = async () => {
    setBlockPending(true);
    try {
      if (blocked) {
        await unblockUserAction(otherUserId);
        setBlocked(false);
        toast.success("Unblocked.");
      } else {
        await blockUserAction(otherUserId);
        setBlocked(true);
        toast.success("Blocked.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBlockPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setShowReport((v) => !v)}
          className="text-neutral-400 hover:text-neutral-700 transition dark:text-neutral-500 dark:hover:text-neutral-300"
        >
          Report
        </button>
        <button
          type="button"
          onClick={toggleBlock}
          disabled={blockPending}
          className="text-neutral-400 hover:text-ink transition disabled:opacity-50 dark:text-neutral-500"
        >
          {blocked ? "Unblock" : "Block"}
        </button>
      </div>

      {showReport && (
        <form action={reportFormAction} className="flex flex-col gap-2 rounded-xl border border-ink/10 p-3">
          {reportState?.success ? (
            <p className="text-sm text-ink">Thanks — our team will take a look.</p>
          ) : (
            <>
              <select
                name="reason"
                required
                defaultValue=""
                aria-label="Reason for report"
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="" disabled>
                  Reason
                </option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <TextareaWithCounter
                name="details"
                rows={2}
                maxLength={500}
                placeholder="Optional details"
                aria-label="Details"
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
              />
              {reportState?.error && <p className="text-sm text-ink">{reportState.error}</p>}
              <button
                type="submit"
                disabled={reportPending}
                className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50 self-start"
              >
                {reportPending ? "Sending…" : "Submit report"}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
