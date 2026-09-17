import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
          border: "3px solid #070707",
        }}
      >
        {/* iOS applies its own rounded-square mask to this regardless, but
            other consumers (PWA install, Android) use the shape as-is. */}
        <img src={logoSrc} width={110} height={51} alt="" />
      </div>
    ),
    { ...size },
  );
}
