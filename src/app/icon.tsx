import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          border: "1px solid #070707",
        }}
      >
        {/* Real wordmark, letterboxed onto a circle — logo.png is a wide
            wordmark (1520x704), not a square mark, so it's shrunk to fit
            the tab-sized canvas rather than cropped or replaced. */}
        <img src={logoSrc} width={24} height={11} alt="" />
      </div>
    ),
    { ...size },
  );
}
