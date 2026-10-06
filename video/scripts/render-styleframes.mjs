// Renders the last frame (the keyframe) of every styleframe composition and puts them on one contact sheet per video:
// out/styleframes/<ID>.png and out/styleframes-{creator,brand}.png.
// Pass --browser-executable=<path> to use a local Chromium instead of Remotion's download.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";

const browserExecutable = process.argv.find((a) => a.startsWith("--browser-executable="))?.split("=")[1] ?? null;
const outDir = "out/styleframes";
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: "src/index.ts" });
const stills = (await getCompositions(serveUrl, { browserExecutable })).filter((c) => /^[CB]\d\d$/.test(c.id));

for (const composition of stills) {
  await renderStill({ composition, serveUrl, frame: composition.durationInFrames - 1, output: `${outDir}/${composition.id}.png`, browserExecutable });
  console.log(`rendered ${composition.id}`);
}

const labels = JSON.parse(readFileSync("src/styleframes/labels.json", "utf8"));
for (const [prefix, name, title] of [["C", "creator", "Creator-Video"], ["B", "brand", "Marken-Video"]]) {
  const args = ["-background", "#e5e5e5", "-fill", "#070707", "-font", "public/fonts/Lato-Bold.ttf", "-pointsize", "26"];
  for (const [id, label] of Object.entries(labels).filter(([id]) => id.startsWith(prefix))) {
    args.push("-label", label, `${outDir}/${id}.png`);
  }
  args.push("-tile", "4x", "-geometry", "540x960+24+24", "-title", title, `out/styleframes-${name}.png`);
  execFileSync("montage", args);
  console.log(`sheet out/styleframes-${name}.png`);
}
