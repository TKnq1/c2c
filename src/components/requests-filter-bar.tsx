"use client";

import { useUrlState } from "@/lib/use-url-state";
import { Select } from "@/components/select";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/translate";

const STATUS_TABS: { value: string; label: MessageKey }[] = [
  { value: "", label: "screens.requests.all" },
  { value: "OPEN", label: "screens.requests.open" },
  { value: "CLOSED", label: "screens.requests.closed" },
];
const DRAFT_TAB: { value: string; label: MessageKey } = { value: "DRAFT", label: "screens.requests.drafts" };

// The Drafts tab is only there when there are drafts (or the page is already on it).
export function RequestsFilterBar({ showDrafts }: { showDrafts: boolean }) {
  const { t } = useI18n();
  const [{ status, sort }, setParam] = useUrlState(["status", "sort"]);
  const tabs = showDrafts || status === DRAFT_TAB.value ? [...STATUS_TABS, DRAFT_TAB] : STATUS_TABS;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex gap-1 rounded bg-fog p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setParam("status", tab.value)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${
              (status || "") === tab.value
                ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>
      <Select
        value={sort || "newest"}
        onChange={(e) => setParam("sort", e.target.value === "newest" ? "" : e.target.value)}
        // From md the table's column headers sort instead.
        wrapperClassName="w-40 md:hidden"
        aria-label={t("screens.requests.sortBy")}
      >
        <option value="newest">{t("screens.requests.newest")}</option>
        <option value="oldest">{t("screens.requests.oldest")}</option>
        <option value="interest">{t("screens.requests.mostInterest")}</option>
      </Select>
    </div>
  );
}
