"use client";

import { useRouter } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { useI18n } from "@/components/i18n-provider";

// router.back() over a plain <Link href="…/discover"> — wherever this page
// was actually reached from (search results, a saved filter, a match) is
// where "back" should return to, not always the same hardcoded list. Same
// look as the "‹ Requests" link on a brand's request page. Opened straight
// from a link (no history to go back to), it goes to fallbackHref instead.
export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallbackHref))}
      className="-mb-4 flex items-center gap-1 self-start text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400 no-print"
    >
      <IoChevronBack className="h-4 w-4" aria-hidden />
      {t("common.back")}
    </button>
  );
}
