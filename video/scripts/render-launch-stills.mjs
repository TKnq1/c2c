// Renders the keyframe (last frame) of every launch-still composition (src/launch/stills.tsx) to out/launch/<ID>.png and puts them on
// one contact sheet, out/launch-stills.png.
// Pass --browser-executable=<path> to use a local Chromium instead of Remotion's download.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";

const browserExecutable = process.argv.find((a) => a.startsWith("--browser-executable="))?.split("=")[1] ?? null;
const outDir = "out/launch";
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: "src/index.ts" });
const stills = (await getCompositions(serveUrl, { browserExecutable })).filter((c) => /^L\d\d$/.test(c.id));

for (const composition of stills) {
  await renderStill({ composition, serveUrl, frame: composition.durationInFrames - 1, output: `${outDir}/${composition.id}.png`, browserExecutable });
  console.log(`rendered ${composition.id}`);
}

const args = ["-background", "#e5e5e5", "-fill", "#070707", "-font", "public/fonts/Lato-Bold.ttf", "-pointsize", "22"];
for (const { id, defaultProps: { label } } of stills) args.push("-label", label ?? id, `${outDir}/${id}.png`);
args.push("-tile", "3x", "-geometry", "640x360+16+16", "-title", "Launch-Video: Szenen", "out/launch-stills.png");
execFileSync("montage", args);
console.log("sheet out/launch-stills.png");
