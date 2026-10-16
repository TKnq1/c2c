"use client";

import { chooseLandingRole, landingPath, type LandingRole } from "@/components/landing/landing-role";
import { useI18n } from "@/components/i18n-provider";

// For whoever reaches the end on the other side's page, the nav's switch
// long since scrolled past their attention. Back to the top, where the
// other side starts.
export function SwitchSideLink() {
  const { t } = useI18n();
  function switchTo(event: React.MouseEvent, role: LandingRole) {
    event.preventDefault();
    chooseLandingRole(role);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <p>
      <a href={landingPath("brand")} data-for="creator" onClick={(e) => switchTo(e, "brand")} className="underline underline-offset-2 hover:text-ink">
        {t("landing.footer.switchToBrands")}
      </a>
      <a href={landingPath("creator")} data-for="brand" onClick={(e) => switchTo(e, "creator")} className="underline underline-offset-2 hover:text-ink">
        {t("landing.footer.switchToCreators")}
      </a>
    </p>
  );
}
