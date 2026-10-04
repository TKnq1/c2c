import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOnboardingComplete } from "@/lib/onboarding";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { BrandOnboarding } from "@/components/brand-onboarding";
import { CreatorOnboarding } from "@/components/creator-onboarding";
import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Set up your profile",
  robots: NO_INDEX,
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  // Already finished (or came from before this flow existed) — nothing to
  // do here, and resubmitting a step would just overwrite real data.
  const [complete, user] = await Promise.all([
    isOnboardingComplete(session.user.id, session.user.role),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    }),
  ]);
  if (complete) redirect(session.user.role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator");
  const emailVerified = !!user?.emailVerified;

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      {/* A way out for someone who signed up with the wrong email or role. */}
      <header className="flex shrink-0 items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:pb-4">
        <Logo />
        <LogoutButton className="text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400" />
      </header>
      {/* The column fills the phone, so a short step can pin its button to
          the bottom. Tall steps still grow the page and scroll. */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-4 sm:pb-12">
        {session.user.role === "STARTUP" ? (
          <BrandOnboarding emailVerified={emailVerified} />
        ) : (
          <CreatorOnboarding emailVerified={emailVerified} />
        )}
      </main>
    </div>
  );
}
