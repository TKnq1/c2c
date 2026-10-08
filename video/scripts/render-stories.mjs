// Renders the Instagram stories (src/stories), 1080 x 1920 (9:16): out/stories/hook.mp4, myth.png, ...
// An animated story becomes an MP4 with sound, mastered to -14 LUFS like the videos (scripts/master.py); a still one a
// PNG. Pass story ids to render only those (node scripts/render-stories.mjs StoryHook StoryMyth), and
// --browser-executable=<path> to use a local Chromium instead of Remotion's download. --props='{"left":82}' goes to
// every story it is given with, e.g. the founding story's counter.
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, unlinkSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, renderStill } from "@remotion/renderer";

const flag = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const browserExecutable = flag("browser-executable");
const inputProps = flag("props") ? JSON.parse(flag("props")) : {};
const only = process.argv.slice(2).filter((a) => /^Story[A-Za-z]+$/.test(a));
const outDir = "out/stories";
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: "src/index.ts" });
const stories = (await getCompositions(serveUrl, { browserExecutable, inputProps })).filter((c) => /^Story[A-Za-z]+$/.test(c.id));

for (const composition of stories) {
  if (only.length > 0 && !only.includes(composition.id)) continue;
  const name = composition.id.replace(/^Story/, "").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  if (composition.durationInFrames > 1) {
    const raw = `${outDir}/${name}.raw.mp4`;
    await renderMedia({ composition, serveUrl, codec: "h264", outputLocation: raw, browserExecutable, inputProps });
    execFileSync("python3", ["scripts/master.py", raw]);
    renameSync(`${outDir}/${name}.raw-final.mp4`, `${outDir}/${name}.mp4`);
    unlinkSync(raw);
    console.log(`rendered ${name}.mp4`);
  } else {
    await renderStill({ composition, serveUrl, output: `${outDir}/${name}.png`, browserExecutable, inputProps });
    console.log(`rendered ${name}.png`);
  }
}
