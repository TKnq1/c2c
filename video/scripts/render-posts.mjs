// Renders the Instagram posts (src/posts) as PNGs, 1080 x 1440 (3:4, the portrait format of the Instagram grid): out/posts/post-1.png ... and one contact sheet,
// out/posts.png. Pass post numbers to render only those (node scripts/render-posts.mjs 1 3), and
// --browser-executable=<path> to use a local Chromium instead of Remotion's download.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";

const browserExecutable = process.argv.find((a) => a.startsWith("--browser-executable="))?.split("=")[1] ?? null;
const only = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
const outDir = "out/posts";
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: "src/index.ts" });
const posts = (await getCompositions(serveUrl, { browserExecutable })).filter((c) => /^Post\d+$/.test(c.id));

for (const composition of posts) {
  const n = composition.id.slice("Post".length);
  if (only.length > 0 && !only.includes(n)) continue;
  await renderStill({ composition, serveUrl, output: `${outDir}/post-${n}.png`, browserExecutable });
  console.log(`rendered post-${n}.png`);
}

const files = readdirSync(outDir)
  .filter((f) => /^post-\d+\.png$/.test(f))
  .sort()
  .map((f) => `${outDir}/${f}`);
execFileSync("montage", [...files, "-background", "#e5e5e5", "-tile", "5x1", "-geometry", "432x576+16+16", "out/posts.png"]);
console.log("sheet out/posts.png");
