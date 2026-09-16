import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "C2C – Brand-Creator Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          gap: 32,
        }}
      >
        <img src={logoSrc} width={440} height={204} alt="" />
        <div style={{ fontSize: 32, color: "#525252", fontFamily: "Arial, Helvetica, sans-serif" }}>
          Brands find matching content creators for collaborations.
        </div>
      </div>
    ),
    { ...size },
  );
}
