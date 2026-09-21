import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// See icon-192/route.tsx — same reasoning, the 512x512 manifest entry.
export async function GET() {
  const logoData = await readFile(join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          border: "6px solid #070707",
        }}
      >
        <img src={logoSrc} width={384} height={178} alt="" />
      </div>
    ),
    { width: 512, height: 512 },
  );
}
