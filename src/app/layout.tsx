import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { PageTransition } from "@/components/page-transition";
import { Toaster } from "@/components/toaster";
import { TopLoadingBar } from "@/components/top-loading-bar";
import { NavigationBlockerProvider } from "@/lib/navigation-blocker";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Substitutes for the BentonSans / AftenScreen pairing this theme is built
// around — same roles (grotesque UI text, condensed editorial display).
const bentonsans = Inter({
  variable: "--font-bentonsans",
  subsets: ["latin"],
  weight: ["400"],
});

const aftenscreen = Fraunces({
  variable: "--font-aftenscreen",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
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
      className={`${bentonsans.variable} ${aftenscreen.variable} h-full antialiased scroll-smooth`}
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
          <PageTransition>{children}</PageTransition>
          <Toaster />
        </NavigationBlockerProvider>
      </body>
    </html>
  );
}
