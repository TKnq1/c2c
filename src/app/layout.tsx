import { Suspense } from "react";
import type { Metadata } from "next";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bentonsans.variable} ${aftenscreen.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before hydration so the correct theme applies on first paint — no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}`,
          }}
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
