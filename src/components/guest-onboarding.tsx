"use client";

import { useLayoutEffect, useState } from "react";
import { BrandOnboarding } from "@/components/brand-onboarding";
import { CreatorOnboarding } from "@/components/creator-onboarding";
import { OnboardingRoleStep } from "@/components/onboarding-role-step";
import { readOnboardingDraft } from "@/lib/onboarding-draft";
import type { SignupRole } from "@/lib/signup-role";

function rememberRole(role: SignupRole) {
  const side = role === "STARTUP" ? "brand" : "creator";
  window.history.replaceState(null, "", `/onboarding?role=${side}`);
}

function forgetRole() {
  window.history.replaceState(null, "", "/onboarding");
}

// No account yet. The side comes from the landing toggle, a saved draft, or
// one question asked before the wizard starts.
export function GuestOnboarding({ initialRole }: { initialRole: SignupRole | null }) {
  const [role, setRole] = useState<SignupRole | null>(initialRole);
  const [booted, setBooted] = useState(initialRole !== null);

  useLayoutEffect(() => {
    if (initialRole) return;
    queueMicrotask(() => {
      const draft = readOnboardingDraft();
      if (draft) {
        setRole(draft.role);
        rememberRole(draft.role);
      }
      setBooted(true);
    });
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
