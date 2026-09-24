import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Larger PWA install icon (Android/Chrome installability wants at least
// 192x192 and 512x512 in the manifest) — same mark as icon.tsx, just
// bigger, since that route's 32x32 is sized for a browser tab, not a
// home-screen icon.
export async function GET() {
  const logoData = await readFile(join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <img src={logoSrc} width={162} height={162} alt="" />
      </div>
    ),
    { width: 192, height: 192 },
  );
}
