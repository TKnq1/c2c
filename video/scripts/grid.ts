// Writes src/voice/grid.json: where each scene starts, in beats, as the videos play them (fitted to the voiceover).
// scripts/make-audio.py builds the music on this grid, so run this before it (npm run audio does both).
import { writeFileSync } from "node:fs";
import { ADS } from "../src/ads";
import { BRAND_CUT } from "../src/brand/BrandVideo";
import { CREATOR_CUT } from "../src/creator/CreatorVideo";
import { BEAT, type FittedScene, sceneStarts, seriesDuration } from "../src/series";

function grid(scenes: FittedScene[]) {
  const starts = sceneStarts(scenes);
  return {
    scenes: Object.fromEntries(scenes.map((scene, i) => [scene.id, starts[i] / BEAT])),
    speeds: Object.fromEntries(scenes.map((scene) => [scene.id, Math.round(scene.speed * 100) / 100])),
    end: seriesDuration(scenes) / BEAT,
  };
}

const out = { creator: grid(CREATOR_CUT), brand: grid(BRAND_CUT), ads: Object.fromEntries(ADS.map((ad) => [ad.id, grid(ad.scenes)])) };
writeFileSync(new URL("../src/voice/grid.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out));
