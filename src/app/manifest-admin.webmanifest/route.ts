// The web app manifest for the admin area, so "Add to Home Screen" gives the dashboard its own icon, name and full-screen
// window. It lives outside /admin on purpose: a browser fetches a manifest without the session cookie, and everything
// under /admin is sent to the login page.
export function GET() {
  const manifest = {
    id: "/admin",
    name: "comtor Admin",
    short_name: "Admin",
    description: "Das Dashboard von comtor.",
    lang: "de",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e1e1e",
    icons: [
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
    shortcuts: [
      { name: "Offen", url: "/admin/offen", icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }] },
      { name: "Mitteilungen", url: "/admin/mitteilungen", icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }] },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" } });
}
