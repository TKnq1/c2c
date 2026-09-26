import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import { Nav } from "@/components/nav";
import { PageTransition } from "@/components/page-transition";
import { Toaster } from "@/components/toaster";
import { TopLoadingBar } from "@/components/top-loading-bar";
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

const SITE_NAME = "C2C – Brand-Creator Marketplace";
const SITE_DESCRIPTION = "Brands find matching content creators for collaborations.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · C2C` },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: "C2C",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "C2C",
    // No media query — one universal fallback rather than the full
    // per-device matrix (see apple-splash/route.tsx for why).
    startupImage: "/apple-splash",
  },
};

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

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "C2C",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <TopLoadingBar />
        </Suspense>
        <NavigationBlockerProvider>
          {/* Above PageTransition, not inside it — that div remounts its
              contents on every navigation on purpose (see page-transition.tsx),
              which was taking Nav down with it since it used to live inside
              dashboard/layout.tsx, further down that same tree. */}
          <Nav />
          <PageTransition>{children}</PageTransition>
          <Toaster />
        </NavigationBlockerProvider>
      </body>
    </html>
  );
}
