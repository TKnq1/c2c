import type { CapacitorConfig } from "@capacitor/cli";

// The native apps are a shell around the live, server-rendered Next.js site
// (Server Actions, auth, Stripe all need the server — there's no static
// export to bundle). CAP_SERVER_URL is read at `npx cap sync` time and baked
// into the native projects, so re-sync after changing it. It has to be the
// same origin as NEXT_PUBLIC_SITE_URL, or Stripe's return URLs would leave
// the app.
// A release build has to name its server: without it the app would be built against plain-http localhost.
// Set CAP_RELEASE=1 for store builds (see docs/store-release.md).
if (!process.env.CAP_SERVER_URL && process.env.CAP_RELEASE === "1") {
  throw new Error("CAP_SERVER_URL is required for a release build (CAP_RELEASE=1).");
}
const serverUrl = process.env.CAP_SERVER_URL ?? "http://localhost:3000";

const config: CapacitorConfig = {
  appId: "app.comtor",
  appName: "comtor",
  // Holds only the offline page (see scripts/write-app-config.mjs), shown
  // through errorPath when serverUrl can't be reached.
  webDir: "capacitor/www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    errorPath: "index.html",
    // Every other host opens in the system browser. Stripe Checkout stays in
    // the app so a payment returns to its success URL here, still signed in.
    allowNavigation: ["*.stripe.com"],
  },
  // Lets the server tell the store apps apart from a browser (see
  // lib/native-app.ts), e.g. to hide the Pro plan purchase.
  ios: {
    appendUserAgent: "ComtorApp/ios",
    contentInset: "never",
  },
  android: {
    appendUserAgent: "ComtorApp/android",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
