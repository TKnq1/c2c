// Renders one still per scene of the launch video (src/launch/stills.tsx) to out/launch/<ID>.png and puts them on
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
const labels = new Map(
  (await import("../src/launch/labels.json", { with: { type: "json" } })).default.map(({ id, label }) => [id, label]),
);

for (const composition of stills) {
  await renderStill({ composition, serveUrl, output: `${outDir}/${composition.id}.png`, browserExecutable });
  console.log(`rendered ${composition.id}`);
}

const args = ["-background", "#e5e5e5", "-fill", "#070707", "-font", "public/fonts/Lato-Bold.ttf", "-pointsize", "22"];
for (const { id } of stills) args.push("-label", labels.get(id) ?? id, `${outDir}/${id}.png`);
args.push("-tile", "3x", "-geometry", "640x360+16+16", "-title", "Launch-Video: Szenen", "out/launch-stills.png");
execFileSync("montage", args);
console.log("sheet out/launch-stills.png");
