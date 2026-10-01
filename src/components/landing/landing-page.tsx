import "@/components/landing/landing.css";
import { ComingSoon } from "@/components/landing/coming-soon";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Hero } from "@/components/landing/hero";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNav } from "@/components/landing/landing-nav";
import { RoleGate } from "@/components/landing/role-gate";

// comtor.app for anyone not logged in (logged-in visitors are sent on to the
// dashboard by the proxy). Creators and brands each get their own half; see
// landing.css for how only one shows.
export function LandingPage() {
  return (
    <div className="flex-1 bg-paper">
      <RoleGate />
      <LandingNav />
      <main>
        <Hero />
        <FeatureGrid />
        <ComingSoon />
      </main>
      <LandingFooter />
    </div>
  );
}
