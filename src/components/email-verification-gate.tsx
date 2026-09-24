"use client";

import { use } from "react";
import { EmailVerificationBanner } from "@/components/email-verification-banner";

// Resolves the emailVerified promise (see dashboard/layout.tsx) inside its
// own Suspense boundary instead of the layout awaiting it directly — same
// reason as Nav's countsPromise: keeps this DB read from gating (and
// re-mounting) the rest of the dashboard shell on every navigation.
export function EmailVerificationGate({ emailVerifiedPromise }: { emailVerifiedPromise: Promise<boolean> }) {
  const emailVerified = use(emailVerifiedPromise);
  if (emailVerified) return null;
  return <EmailVerificationBanner />;
}
