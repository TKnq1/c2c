import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "C2C – Brand-Creator Marketplace",
    short_name: "C2C",
    description: "Brands find matching content creators for collaborations.",
    start_url: "/login",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e1e1e",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
    // Long-press the home-screen icon for quick actions. /dashboard itself
    // redirects to whichever of Requests/Feed fits the signed-in role, so
    // these work without knowing in advance who's tapping them.
    shortcuts: [
      {
        name: "Dashboard",
        url: "/dashboard",
        icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Messages",
        url: "/dashboard/messages",
        icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
