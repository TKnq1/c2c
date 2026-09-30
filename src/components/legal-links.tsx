import Link from "next/link";
import { IoChevronForward } from "react-icons/io5";
import { SettingsSection } from "@/components/settings-section";

const LINKS = [
  { href: "/legal/imprint", label: "Imprint" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms" },
];

// Shared by both settings pages — the footer that used to carry these
// (Imprint/Privacy/Terms) is gone from the app now, so this is the one
// place a logged-in user finds them. Public/logged-out pages keep a
// minimal standalone Imprint link instead (see e.g. home-hero.tsx) —
// Impressumspflicht requires it reachable without an account too.
export function LegalLinks() {
  return (
    <SettingsSection id="legal" title="Legal">
      <nav aria-label="Legal" className="-my-1 flex flex-col divide-y divide-ink/10">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center justify-between gap-3 py-3 text-sm font-medium first:pt-1 last:pb-1"
          >
            {l.label}
            <IoChevronForward className="h-4 w-4 text-neutral-400" />
          </Link>
        ))}
      </nav>
    </SettingsSection>
  );
}
