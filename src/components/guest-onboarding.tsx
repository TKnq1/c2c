"use client";

import { useLayoutEffect, useState } from "react";
import { BrandOnboarding } from "@/components/brand-onboarding";
import { CreatorOnboarding } from "@/components/creator-onboarding";
import { OnboardingRoleStep } from "@/components/onboarding-role-step";
import { clearOnboardingDraft } from "@/lib/onboarding-draft";
import { captureUtm } from "@/lib/utm-capture";
import { utmQuery } from "@/lib/utm";
import type { SignupRole } from "@/lib/signup-role";

function rememberRole(role: SignupRole) {
  const side = role === "STARTUP" ? "brand" : "creator";
  const utm = utmQuery(captureUtm());
  window.history.replaceState(null, "", `/onboarding?role=${side}${utm ? `&${utm}` : ""}`);
}

function forgetRole() {
  // The wizard writes a draft as soon as a side is picked, including on the
  // language step. Leaving that step has to drop it, or a refresh of the
  // role question reads the draft and opens the language step again.
  clearOnboardingDraft();
  const utm = utmQuery(captureUtm());
  window.history.replaceState(null, "", utm ? `/onboarding?${utm}` : "/onboarding");
}

// No account yet. The side comes from the landing toggle (?role=) or from
// the role question. A bare /onboarding stays on that question.
export function GuestOnboarding({ initialRole }: { initialRole: SignupRole | null }) {
  const [role, setRole] = useState<SignupRole | null>(initialRole);
  // Read before anything rewrites the address (see rememberRole).
  useLayoutEffect(() => {
    captureUtm();
  }, []);
  const [booted, setBooted] = useState(initialRole !== null);

  useLayoutEffect(() => {
    // A role in the URL is a wizard already in progress. A bare /onboarding
    // is the role question, even if an older draft is still in this tab.
    if (initialRole) return;
    clearOnboardingDraft();
    // The draft lives in the browser's session storage, so this can only run after mount; until then the
    // page renders the empty shell (see `booted` below).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off, after the client-only clear above
    setBooted(true);
  }, [initialRole]);

  if (!booted) return <div className="flex flex-1" />;
  if (!role) {
    return (
      <OnboardingRoleStep
        onChoose={(next) => {
          rememberRole(next);
          setRole(next);
        }}
      />
    );
  }
  const onLeave = () => {
    forgetRole();
    setRole(null);
  };
  if (role === "STARTUP") return <BrandOnboarding mode="guest" emailVerified={false} onLeave={onLeave} />;
  return <CreatorOnboarding mode="guest" emailVerified={false} onLeave={onLeave} />;
}
