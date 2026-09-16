"use client";

import { useUrlState } from "@/lib/use-url-state";
import { Select } from "@/components/select";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
] as const;

export function RequestsFilterBar() {
  const [{ status, sort }, setParam] = useUrlState(["status", "sort"]);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex gap-1 rounded bg-fog p-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setParam("status", t.value)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${
              (status || "") === t.value
                ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Select
        value={sort || "newest"}
        onChange={(e) => setParam("sort", e.target.value === "newest" ? "" : e.target.value)}
        wrapperClassName="w-40"
        aria-label="Sort by"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="interest">Most interest</option>
      </Select>
    </div>
  );
}
