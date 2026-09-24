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
      // Full-bleed square, no circle/border of our own — iOS already
      // applies its own rounded-square mask on top of this, so drawing a
      // second shape here just doubled up as a ring around a smaller,
      // off-center-looking mark.
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
        <img src={logoSrc} width={152} height={152} alt="" />
      </div>
    ),
    { ...size },
  );
}
