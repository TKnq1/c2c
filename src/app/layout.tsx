import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { Nav } from "@/components/nav";
import { getLocale, getT } from "@/lib/i18n/server";
import { NativePushBridge } from "@/components/native-push-bridge";
import { NativeBackButton } from "@/components/native-back-button";
import { InAppNavigationMarker } from "@/lib/in-app-navigation";
import { PageTransition } from "@/components/page-transition";
import { Toaster } from "@/components/toaster";
import { TopLoadingBar } from "@/components/top-loading-bar";
import { AppSplash } from "@/components/app-splash";
import { APP_SPLASH_SCRIPT } from "@/lib/app-splash";
import { NavigationBlockerProvider } from "@/lib/navigation-blocker";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// One typeface for everything (UI text and headings alike) — see the type
// scale in globals.css, which pairs each size with one of these three
// weights. --font-display in globals.css points at this same variable, not
// a second font load: there's no separate display face anymore.
const lato = Lato({
  variable: "--font-bentonsans",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

// Title and description follow the visitor's language (German unless they chose another).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const siteName = t("landing.meta.siteName");
  const siteDescription = t("landing.meta.siteDescription");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: siteName, template: `%s · comtor` },
    description: siteDescription,
    openGraph: {
      title: siteName,
      description: siteDescription,
      siteName: "comtor",
      locale: (await getLocale()) === "de" ? "de_DE" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDescription,
    },
    // Google Search Console ownership check for the site's domain.
    verification: { google: "phXZ3gI5wDzbgcuHAxcyl_QNIH8Gw9lKXY7Gz-LH43k" },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "comtor",
      // No media query — one universal fallback rather than the full
      // per-device matrix (see apple-splash/route.tsx for why).
      startupImage: "/apple-splash",
    },
  };
}

// content is the light-mode default (matches --paper); the anti-FOUC
// script below overwrites it before first paint when dark mode applies,
// and setTheme (src/lib/theme.ts) keeps it in sync after that on toggle —
// a single unconditional tag rather than prefers-color-scheme media
// queries, since dark mode here is a user choice (localStorage), not
// purely OS-driven.
export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
  colorScheme: "light dark",
  // Without this, opening the keyboard (e.g. typing a message) leaves the
  // layout viewport at its full height in most browsers — the fixed
  // bottom tab bar (see Nav) then sits underneath the keyboard instead of
  // riding above it. resizes-content shrinks the actual viewport instead,
  // so fixed-positioned chrome stays where it visually belongs.
  interactiveWidget: "resizes-content",
};

function organizationJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "comtor",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = await getT();
  return (
    <html
      lang={locale}
      className={`${lato.variable} h-full antialiased scroll-smooth`}
      // Tells the router to switch scroll-smooth off while it scrolls to
      // the top on a navigation — a tab change shouldn't glide.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Runs before hydration so the correct theme (and status-bar
            color to match) applies on first paint — no flash. #1e1e1e here
            must stay in sync with --paper's dark value in globals.css and
            THEME_COLOR in src/lib/theme.ts. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', '#1e1e1e');
  }
} catch (e) {}`,
          }}
        />
        {/* Shows the logo splash (see AppSplash) before first paint; sets
            data-splash="on" on <html> when this load should have one. */}
        <script dangerouslySetInnerHTML={{ __html: APP_SPLASH_SCRIPT }} />
        <link rel="preload" as="image" href="/logo-splash.png" fetchPriority="high" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(t("landing.meta.siteDescription"))) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>
        <AppSplash />
        <Suspense fallback={null}>
          <TopLoadingBar />
        </Suspense>
        <NavigationBlockerProvider>
          {/* Above PageTransition, not inside it — that div remounts its
              contents on every navigation on purpose (see page-transition.tsx),
              which was taking Nav down with it since it used to live inside
              dashboard/layout.tsx, further down that same tree. */}
          <Nav />
          <InAppNavigationMarker />
          {/* The boundary is what lets the server send this shell (and so the
              splash) straight away. Without it, a layout further down that
              awaits the database, like dashboard/layout.tsx, holds back the
              whole response until Neon has answered. The fallback is only
              a marker for AppSplash to wait on. Outside PageTransition so
              its per-route remount never creates a new boundary, which
              would blank the page on every navigation. */}
          <Suspense fallback={<div data-splash-hold hidden />}>
            <PageTransition>{children}</PageTransition>
          </Suspense>
          <Toaster />
          <NativePushBridge />
          <NativeBackButton />
        </NavigationBlockerProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
