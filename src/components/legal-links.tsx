import Link from "next/link";
import { IoChevronForward } from "react-icons/io5";
import { SettingsSection } from "@/components/settings-section";
import { getT } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";

const LINKS: { href: string; label: MessageKey }[] = [
  { href: "/legal/imprint", label: "screens.settings.imprint" },
  { href: "/legal/privacy", label: "screens.settings.privacy" },
  { href: "/legal/terms", label: "screens.settings.terms" },
];

// Shared by both settings pages — the footer that used to carry these
// (Imprint/Privacy/Terms) is gone from the app now, so this is the one
// place a logged-in user finds them. Public/logged-out pages keep a
// minimal standalone Imprint link instead (see e.g. home-hero.tsx) —
// Impressumspflicht requires it reachable without an account too.
export async function LegalLinks() {
  const t = await getT();
  return (
    <SettingsSection id="legal" title={t("screens.settings.legal")}>
      <nav aria-label={t("screens.settings.legal")} className="-my-1 flex flex-col divide-y divide-ink/10">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center justify-between gap-3 py-3 text-sm font-medium first:pt-1 last:pb-1"
          >
            {t(l.label)}
            <IoChevronForward className="h-4 w-4 text-neutral-400" />
          </Link>
        ))}
      </nav>
    </SettingsSection>
  );
}
