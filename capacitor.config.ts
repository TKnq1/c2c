import type { CapacitorConfig } from "@capacitor/cli";

// The native apps are a shell around the live, server-rendered Next.js site
// (Server Actions, auth, Stripe all need the server — there's no static
// export to bundle). CAP_SERVER_URL is read at `npx cap sync` time and baked
// into the native projects, so re-sync after changing it.
const serverUrl = process.env.CAP_SERVER_URL ?? "http://localhost:3000";

const config: CapacitorConfig = {
  appId: "app.comtor",
  appName: "comtor",
  // Only shown if the server can't be reached at all — the WebView loads
  // serverUrl, not this folder.
  webDir: "capacitor/www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
  // Lets the server tell the store apps apart from a browser (see
  // lib/native-app.ts) — e.g. to hide the Pro plan purchase on iOS.
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
