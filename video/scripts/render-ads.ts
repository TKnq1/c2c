// Renders the 15 s ads (src/ads, ADS.md).
//
//   npm run ads                              one contact sheet per ad with the keyframe of each beat: out/ads/<ID>.png
//   npm run ads:video                        the videos too: out/ads/<ID>.mp4 (mastered like the long videos)
//   npm run ads -- --only=AC1,AB2            just these ads
//   npm run ads -- --only=AC1 --probe=2:80,86,92   stills of scene 3 (index 2) at those frames (as drawn): out/ads/probe/
//
// Pass --browser-executable=<path> to use a local Chromium instead of Remotion's download (the preinstalled one is
// picked up by itself).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, renderStill } from "@remotion/renderer";
import { ADS } from "../src/ads";
import { sceneStarts } from "../src/series";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
// The cloud sessions have a Chromium preinstalled and can't download Remotion's.
const PREINSTALLED = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = arg("browser-executable") ?? (existsSync(PREINSTALLED) ? PREINSTALLED : null);
const only = arg("only")?.split(",");
const video = process.argv.includes("--video");
const probe = arg("probe");
const outDir = "out/ads";
const BEATS = ["Pain", "Turn", "Mechanismus", "Payoff", "Offer + CTA"];
mkdirSync(`${outDir}/frames`, { recursive: true });

async function main() {
  const serveUrl = await bundle({ entryPoint: "src/index.ts" });
  const compositions = await getCompositions(serveUrl, { browserExecutable });

  for (const ad of ADS.filter((a) => !only || only.includes(a.id))) {
    const composition = compositions.find((c) => c.id === ad.id);
    if (!composition) throw new Error(`No composition ${ad.id}`);
    const starts = sceneStarts(ad.scenes);
    if (probe) {
      const [index, frames] = probe.split(":");
      mkdirSync(`${outDir}/probe`, { recursive: true });
      for (const local of frames.split(",").map(Number)) {
        const scene = ad.scenes[Number(index)];
        const frame = Math.round(starts[Number(index)] + local / scene.speed);
        await renderStill({ composition, serveUrl, frame, output: `${outDir}/probe/${ad.id}-${index}-${local}.png`, browserExecutable });
      }
      continue;
    }
    const stills = ad.scenes.map((scene, i) => ({ id: scene.id, frame: Math.min(ad.duration - 1, Math.round(starts[i] + scene.keyframe / scene.speed)) }));
    for (const { id, frame } of stills) {
      await renderStill({ composition, serveUrl, frame, output: `${outDir}/frames/${id}.png`, browserExecutable });
    }
    const args = ["-background", "#e5e5e5", "-fill", "#070707", "-font", "public/fonts/Lato-Bold.ttf", "-pointsize", "22"];
    ad.scenes.forEach((scene, i) => args.push("-label", `${scene.id} · ${BEATS[i]}`, `${outDir}/frames/${scene.id}.png`));
    args.push("-tile", "5x", "-geometry", "432x768+16+16", "-title", `${ad.id} · ${ad.painpoint}`, `${outDir}/${ad.id}.png`);
    execFileSync("montage", args);
    console.log(`sheet ${outDir}/${ad.id}.png`);

    if (video) {
      const output = resolve(`${outDir}/${ad.id}.mp4`);
      await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: output, browserExecutable });
      execFileSync("python3", ["scripts/master.py", output], { stdio: "inherit" });
      console.log(`video ${output}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
