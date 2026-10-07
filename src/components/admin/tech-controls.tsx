"use client";

import { useTransition } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { refreshTechAction } from "@/lib/actions/admin-tech";
import { toast } from "@/lib/toast";

export function RefreshButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await refreshTechAction();
          if (result.error) toast.error(result.error);
        })
      }
      className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-1.5 text-xs font-bold transition hover:bg-fog disabled:opacity-50"
    >
      <FiRefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} aria-hidden />
      Jetzt abfragen
    </button>
  );
}
