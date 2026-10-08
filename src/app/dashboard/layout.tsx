import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NavCounts } from "@/components/nav";
import { UnreadTitleBadge } from "@/components/unread-title-badge";
import { WelcomeOverlay } from "@/components/welcome-overlay";
import { EmailVerificationGate } from "@/components/email-verification-gate";
import { InstallPrompt } from "@/components/install-prompt";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { RememberArea } from "@/components/remember-area";
import { ScrollToHash } from "@/components/scroll-to-hash";
import { hasAdminAccess } from "@/lib/admin-access";
import { getUnreadCount } from "@/lib/notifications";
import { getUnreadMessageCount } from "@/lib/messages";
import { getPendingPaymentActionCount } from "@/lib/payments";
import { isOnboardingComplete } from "@/lib/onboarding";
import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

// The signed-in app: never in search, whatever links to it.
export const metadata: Metadata = { robots: NO_INDEX };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
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
        {t("screens.ui.skipToContent")}
      </a>
      <Suspense fallback={null}>
        <WelcomeOverlay />
      </Suspense>
      <Suspense fallback={null}>
        <UnreadTitleBadge countsPromise={countsPromise} />
      </Suspense>
      <PullToRefresh />
      <ScrollToHash />
      {/* An admin with a brand or creator account: the installed dashboard opens in the area used last. */}
      {hasAdminAccess(session.user) && <RememberArea area="app" />}
      {/* On phones <main> runs the full height of the screen, under the
          floating header and tab bar (see Nav): the top padding clears the
          header (--header-h, also what scroll-padding keeps anchors and
          focused fields clear of), the bottom one the tab bar. From md up
          the header is an ordinary bar above it. Lists and tables (pages
          marked .page-wide) get more room on large screens than reading
          pages like settings or a request. */}
      <main
        id="main-content"
        className="flex-1 min-h-0 overflow-y-auto max-w-5xl has-[.page-wide]:max-w-7xl w-full mx-auto px-6 pt-[calc(var(--header-h)+2rem)] pb-24 max-md:scroll-pt-[var(--header-h)] md:pt-8 md:pb-8"
      >
        {/* Inside <main>, right under the header, so they scroll away with
            the page instead of sitting between the header and a page that
            scrolls under it. Gone when neither has anything to say. */}
        <div className="dashboard-banners -mx-6 -mt-8 mb-8 empty:hidden">
          <Suspense fallback={null}>
            <EmailVerificationGate emailVerifiedPromise={emailVerifiedPromise} />
          </Suspense>
          <InstallPrompt />
        </div>
        {children}
      </main>
    </div>
  );
}
