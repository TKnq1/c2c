// Renders the pinned Instagram carousels (src/pinned), 1080 x 1440 (3:4): out/pinned/creator-1.mp4, brand-1.mp4 ...
// An animated slide becomes an MP4 with sound, mastered to -14 LUFS like the videos (scripts/master.py); a still
// one a PNG. Pass slide ids to render only those (node scripts/render-posts.mjs PinCreator1), and
// --browser-executable=<path> to use a local Chromium instead of Remotion's download.
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, unlinkSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, renderStill } from "@remotion/renderer";

const browserExecutable = process.argv.find((a) => a.startsWith("--browser-executable="))?.split("=")[1] ?? null;
const only = process.argv.slice(2).filter((a) => /^Pin(Creator|Brand)\d+$/.test(a));
const outDir = "out/pinned";
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: "src/index.ts" });
const slides = (await getCompositions(serveUrl, { browserExecutable })).filter((c) => /^Pin(Creator|Brand)\d+$/.test(c.id));

for (const composition of slides) {
  if (only.length > 0 && !only.includes(composition.id)) continue;
  const name = composition.id.replace(/^Pin/, "").replace(/(\d+)$/, "-$1").toLowerCase();
  if (composition.durationInFrames > 1) {
    const raw = `${outDir}/${name}.raw.mp4`;
    await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: raw, browserExecutable });
    execFileSync("python3", ["scripts/master.py", raw]);
    renameSync(`${outDir}/${name}.raw-final.mp4`, `${outDir}/${name}.mp4`);
    unlinkSync(raw);
    console.log(`rendered ${name}.mp4`);
  } else {
    await renderStill({ composition, serveUrl, output: `${outDir}/${name}.png`, browserExecutable });
    console.log(`rendered ${name}.png`);
  }
}
