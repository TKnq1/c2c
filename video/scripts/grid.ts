// Writes src/voice/grid.json: where each scene starts, in beats, as the videos play them (fitted to the voiceover).
// scripts/make-audio.py builds the music on this grid, so run this before it (npm run audio does both).
import { writeFileSync } from "node:fs";
import { ADS } from "../src/ads";
import { BRAND_CUT } from "../src/brand/BrandVideo";
import { CREATOR_CUT } from "../src/creator/CreatorVideo";
import { FRAMES_PER_BEAT, LAUNCH_BPM, LAUNCH_DURATION, LAUNCH_SCENES } from "../src/launch/scenes";
import { BEAT, type FittedScene, sceneStarts, seriesDuration } from "../src/series";

function grid(scenes: FittedScene[]) {
  const starts = sceneStarts(scenes);
  return {
    scenes: Object.fromEntries(scenes.map((scene, i) => [scene.id, starts[i] / BEAT])),
    speeds: Object.fromEntries(scenes.map((scene) => [scene.id, Math.round(scene.speed * 100) / 100])),
    end: seriesDuration(scenes) / BEAT,
  };
}

// The launch video runs at its own tempo; its scenes start on whole beats of it.
const launch = {
  bpm: LAUNCH_BPM,
  scenes: Object.fromEntries(LAUNCH_SCENES.map((scene) => [scene.id, scene.beat])),
  end: Math.round((LAUNCH_DURATION / FRAMES_PER_BEAT) * 100) / 100,
};

const out = { creator: grid(CREATOR_CUT), brand: grid(BRAND_CUT), ads: Object.fromEntries(ADS.map((ad) => [ad.id, grid(ad.scenes)])), launch };
writeFileSync(new URL("../src/voice/grid.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out));
