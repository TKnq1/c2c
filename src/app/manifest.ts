import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "C2C – Brand-Creator Marketplace",
    short_name: "C2C",
    description: "Brands find matching content creators for collaborations.",
    start_url: "/login",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#070707",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
