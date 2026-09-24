import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NavCounts } from "@/components/nav";
import { UnreadTitleBadge } from "@/components/unread-title-badge";
import { WelcomeOverlay } from "@/components/welcome-overlay";
import { EmailVerificationGate } from "@/components/email-verification-gate";
import { InstallPrompt } from "@/components/install-prompt";
import { getUnreadCount } from "@/lib/notifications";
import { getUnreadMessageCount } from "@/lib/messages";
import { getPendingPaymentActionCount } from "@/lib/payments";
import { isOnboardingComplete } from "@/lib/onboarding";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  // Signed up but never finished the onboarding wizard (closed the tab,
  // came back later, whatever) — every dashboard page assumes a filled-in
  // profile, so send them back to finish it before anything else renders.
  const onboardingComplete = await isOnboardingComplete(session.user.id, session.user.role);
  if (!onboardingComplete) redirect("/onboarding");

  // Deliberately NOT awaited — only UnreadTitleBadge (sets the tab title)
  // reads this now; Nav fetches its own counts client-side (see nav.tsx)
  // since it no longer lives in this tree. Not awaiting still keeps this
  // DB round-trip from blocking everything below it on every navigation.
  //
  // The pending-payments count only ever renders on the creator nav item
  // (see Nav) — for a startup session, getPendingPaymentActionCount's own
  // creatorProfile lookup would always come back empty, so it's skipped
  // entirely rather than spending a Neon round-trip on every dashboard
  // page load just to compute a number nothing displays.
  const countsPromise: Promise<NavCounts> = Promise.all([
    getUnreadCount(session.user.id),
    getUnreadMessageCount(session.user.id, session.user.role),
    session.user.role === "CREATOR" ? getPendingPaymentActionCount(session.user.id) : Promise.resolve(0),
  ]).then(([unreadCount, unreadMessages, pendingPayments]) => ({ unreadCount, unreadMessages, pendingPayments }));

  const emailVerifiedPromise = prisma.user
    .findUnique({ where: { id: session.user.id }, select: { emailVerified: true } })
    .then((user) => !!user?.emailVerified);

  return (
    // flex-1 min-h-0, not h-dvh — the viewport-height constraint now lives
    // on <body> (toggled by Nav, see globals.css .dashboard-shell), since
    // Nav itself moved above this tree entirely. This div just has to
    // cooperate with that outer flex column so <main> below still fills
    // exactly what's left under Nav's header and can scroll internally,
    // which is what lets the Feed page opt out of page-level scroll.
    <div className="flex-1 min-h-0 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded-lg focus:bg-neutral-900 focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <Suspense fallback={null}>
        <WelcomeOverlay />
      </Suspense>
      <Suspense fallback={null}>
        <UnreadTitleBadge countsPromise={countsPromise} />
      </Suspense>
      <Suspense fallback={null}>
        <EmailVerificationGate emailVerifiedPromise={emailVerifiedPromise} />
      </Suspense>
      <InstallPrompt />
      {/* Extra bottom padding on mobile clears the fixed bottom tab bar
          (see Nav) — back to the normal amount from md up, where nav is a
          plain header instead. */}
      <main
        id="main-content"
        className="flex-1 min-h-0 overflow-y-auto max-w-5xl w-full mx-auto px-6 pt-8 pb-24 md:pb-8"
      >
        {children}
      </main>
    </div>
  );
}
