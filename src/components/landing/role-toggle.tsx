"use client";

import { chooseLandingRole, useLandingRole } from "@/components/landing/landing-role";
import { useI18n } from "@/components/i18n-provider";

// Creators | Brands. Which half is lit comes from CSS on
// html[data-landing-role] (see landing.css), so it's right from the first
// paint, before React has caught up with a choice made on an earlier visit.
export function RoleToggle({ className = "" }: { className?: string }) {
  const role = useLandingRole() ?? "creator";
  const { t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("landing.nav.toggleLabel")}
      className={`lp-toggle relative grid grid-cols-[1fr_1fr] rounded-full bg-ink/[0.06] p-1 text-[13px] font-semibold sm:text-sm ${className}`}
    >
      <span aria-hidden="true" className="lp-toggle-thumb absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-ink shadow-sm" />
      {(["creator", "brand"] as const).map((value) => (
        <button
          key={value}
          type="button"
          data-value={value}
          aria-pressed={role === value}
          onClick={() => chooseLandingRole(value)}
          className="relative z-10 rounded-full px-3 py-1.5 whitespace-nowrap sm:px-4"
        >
          {value === "creator" ? t("landing.nav.creators") : t("landing.nav.brands")}
        </button>
      ))}
    </div>
  );
}
