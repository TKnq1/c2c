// Renders the Instagram posts (src/posts) as PNGs, 1080 x 1440 (3:4, the portrait format of the Instagram grid): out/posts/post-1.png ... and one contact sheet,
// out/posts.png. Pass post numbers to render only those (node scripts/render-posts.mjs 1 3), and
// --browser-executable=<path> to use a local Chromium instead of Remotion's download.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";

const browserExecutable = process.argv.find((a) => a.startsWith("--browser-executable="))?.split("=")[1] ?? null;
// "Pin" renders the pinned carousels (PinCreator1, PinBrand1, ...) to out/pinned instead.
const pinned = process.argv.includes("Pin");
const only = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
const outDir = pinned ? "out/pinned" : "out/posts";
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: "src/index.ts" });
const pattern = pinned ? /^Pin(Creator|Brand)\d+$/ : /^Post\d+$/;
const posts = (await getCompositions(serveUrl, { browserExecutable })).filter((c) => pattern.test(c.id));

for (const composition of posts) {
  const n = composition.id.match(/\d+$/)[0];
  if (only.length > 0 && !only.includes(n)) continue;
  const name = pinned ? composition.id.replace(/^Pin/, "").toLowerCase() : `post-${n}`;
  await renderStill({ composition, serveUrl, output: `${outDir}/${name}.png`, browserExecutable });
  console.log(`rendered ${name}.png`);
}

const files = readdirSync(outDir)
  .filter((f) => f.endsWith(".png"))
  .sort()
  .map((f) => `${outDir}/${f}`);
const sheet = pinned ? "out/pinned.png" : "out/posts.png";
execFileSync("montage", [...files, "-background", "#e5e5e5", "-tile", `${Math.min(files.length, 6)}x`, "-geometry", "432x576+16+16", sheet]);
console.log(`sheet ${sheet}`);
