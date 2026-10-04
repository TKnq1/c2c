"use client";

import Link from "next/link";
import { useLandingRole } from "@/components/landing/landing-role";

// A link to sign-up that carries the side of the page the visitor is looking
// at (Creators or Brands), so it's already chosen there instead of the form
// guessing. Creators until a side is picked, as the toggle itself shows.
export function SignupLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const side = useLandingRole() ?? "creator";
  return (
    <Link href={`/onboarding?role=${side}`} className={className}>
      {children}
    </Link>
  );
}
