// Writes the static browser icons from the same artwork as the app icon (src/lib/og-images.tsx):
//   src/app/icon.png      192x192, the tab icon (browsers scale it down smoothly, which a 32px render doesn't)
//   src/app/favicon.ico   16, 32, 48 and 96 px frames, for Safari and everything that still asks for /favicon.ico
// Run from the repository root after changing the artwork:  npx tsx scripts/make-app-icons.mts
// Needs ffmpeg (for the downscaling).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appIcon } from "../src/lib/og-images";

const dir = mkdtempSync(join(tmpdir(), "comtor-icons-"));
const big = join(dir, "512.png");
writeFileSync(big, Buffer.from(await appIcon(512, { ios: false }).arrayBuffer()));

function scaled(size: number, out: string) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", big, "-vf", `scale=${size}:${size}:flags=lanczos`, out]);
  return readFileSync(out);
}

writeFileSync("src/app/icon.png", scaled(192, join(dir, "192.png")));

const sizes = [16, 32, 48, 96];
const frames = sizes.map((size) => scaled(size, join(dir, `${size}.png`)));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1, 2); // icon
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach((png, i) => {
  const at = 6 + 16 * i;
  header.writeUInt8(sizes[i], at);
  header.writeUInt8(sizes[i], at + 1);
  header.writeUInt16LE(1, at + 4); // planes
  header.writeUInt16LE(32, at + 6); // bits per pixel
  header.writeUInt32LE(png.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += png.length;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...frames]));
console.log("wrote src/app/icon.png and src/app/favicon.ico");
