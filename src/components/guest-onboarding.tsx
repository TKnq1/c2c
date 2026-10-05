"use client";

import { useLayoutEffect, useState } from "react";
import { BrandOnboarding } from "@/components/brand-onboarding";
import { CreatorOnboarding } from "@/components/creator-onboarding";
import { OnboardingRoleStep, type RolePreview } from "@/components/onboarding-role-step";
import { readOnboardingDraft } from "@/lib/onboarding-draft";
import type { SignupRole } from "@/lib/signup-role";

function rememberRole(role: SignupRole) {
  const side = role === "STARTUP" ? "brand" : "creator";
  window.history.replaceState(null, "", `/onboarding?role=${side}`);
}

// No account yet. The side comes from the landing toggle, a saved draft, or
// one question asked before the wizard starts.
export function GuestOnboarding({
  initialRole,
  preview = null,
}: {
  initialRole: SignupRole | null;
  preview?: RolePreview | null;
}) {
  const [role, setRole] = useState<SignupRole | null>(preview ? null : initialRole);
  const [booted, setBooted] = useState(preview !== null || initialRole !== null);

  useLayoutEffect(() => {
    if (initialRole || preview) return;
    queueMicrotask(() => {
      const draft = readOnboardingDraft();
      if (draft) {
        setRole(draft.role);
        rememberRole(draft.role);
      }
      setBooted(true);
    });
  }, [initialRole, preview]);

  if (!booted) return <div className="flex flex-1" />;
  if (!role) {
    return (
      <OnboardingRoleStep
        preview={preview}
        onChoose={(next) => {
          rememberRole(next);
          setRole(next);
        }}
      />
    );
  }
  if (role === "STARTUP") return <BrandOnboarding mode="guest" emailVerified={false} />;
  return <CreatorOnboarding mode="guest" emailVerified={false} />;
}
