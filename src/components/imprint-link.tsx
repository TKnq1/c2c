"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

// The site-wide footer is gone (logged-in users find Imprint/Privacy/Terms
// in Settings now) — but Impressumspflicht requires the imprint itself to
// stay reachable from every page, including the ones someone reaches
// before ever signing in. This is that minimum: used on the pages that
// have no footer and no Settings to fall back on (home hero, login, signup).
export function ImprintLink() {
  const { t } = useI18n();
  return (
    <Link
      href="/legal/imprint"
      className="fixed bottom-4 right-4 text-xs text-neutral-400 hover:text-ink transition dark:text-neutral-500 dark:hover:text-white"
    >
      {t("screens.settings.imprint")}
    </Link>
  );
}
