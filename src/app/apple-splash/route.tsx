import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// One universal splash image rather than the full apple-touch-startup-image
// device/orientation matrix (a dozen-plus exact pixel sizes, impossible to
// verify without the actual hardware — getting one wrong tends to look
// worse than not shipping it at all). Referenced without a `media` query
// in layout.tsx, so iOS centers/letterboxes this on whatever's launching
// it instead of falling through to a blank flash. Sized to a common
// current iPhone's physical pixels so it's exact there and a reasonable
// fallback everywhere else.
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
        <img src={logoSrc} width={360} height={360} alt="" />
      </div>
    ),
    { width: 1170, height: 2532 },
  );
}
