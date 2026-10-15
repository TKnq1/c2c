"use client";

import { useUrlState } from "@/lib/use-url-state";
import { FilterChip, FilterChipRow, SortMenu } from "@/components/filters";
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <FilterChipRow label={t("screens.requests.status")}>
        {tabs.map((tab) => (
          <FilterChip key={tab.value} active={(status || "") === tab.value} onClick={() => setParam("status", tab.value)}>
            {t(tab.label)}
          </FilterChip>
        ))}
      </FilterChipRow>
      {/* From md the table's column headers sort instead. */}
      <SortMenu
        value={sort || "newest"}
        onChange={(v) => setParam("sort", v === "newest" ? "" : v)}
        label={t("screens.requests.sortBy")}
        className="md:hidden"
        options={[
          { value: "newest", label: t("screens.requests.newest") },
          { value: "oldest", label: t("screens.requests.oldest") },
          { value: "interest", label: t("screens.requests.mostInterest") },
        ]}
      />
    </div>
  );
}
