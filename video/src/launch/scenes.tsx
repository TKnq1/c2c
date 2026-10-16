import { BRAND_SCENES } from "./scenes-brand";
import { CREATOR_SCENES } from "./scenes-creator";

// The launch video's scenes in order (LAUNCH.md), cut after the reference: nothing ever stands still. The scenes
// themselves are in scenes-creator.tsx and scenes-brand.tsx; this file only orders and times them.

export type Enter = "fade" | "zoom";

// The music runs at 108 BPM (the reference's tempo): every scene lasts whole beats, so every cut lands on a beat.
// Scenes overlap by OVERLAP frames (the next one fades in over the end of this one); the music's grid
// (scripts/grid.ts, scripts/make-audio.py --launch) reads the starts from here.
export const LAUNCH_BPM = 108;
export const FRAMES_PER_BEAT = (30 * 60) / LAUNCH_BPM;
export const OVERLAP = 10;
// The last scene holds this long after its last beat.
const END_HOLD = 24;

export type LaunchScene = {
  id: string;
  label: string;
  component: React.FC;
  // Length in beats, up to the next scene's start.
  beats: number;
  keyframe: number;
  enter?: Enter;
  // Leaves by zooming into this point of the frame (CSS transform-origin), `exitScale` times (default 7).
  exit?: string;
  exitScale?: number;
};

const C = CREATOR_SCENES;
const B = BRAND_SCENES;

const SCENES: LaunchScene[] = [
  { id: "L01", label: "1 · Kaltakquise und Geld", component: C.Opening, beats: 17, keyframe: 120, exit: "66% 50%" },
  { id: "L02", label: "2 · Wendung", component: C.Turn, beats: 6, keyframe: 50, enter: "zoom" },
  { id: "L03", label: "3 · Reveal comtor", component: C.Reveal, beats: 9, keyframe: 120 },
  { id: "L04", label: "4 · Claim und Produkt", component: C.ClaimProduct, beats: 13, keyframe: 200, exit: "37% 57%", exitScale: 5 },
  { id: "L05", label: "5 · Matching", component: C.Matching, beats: 11, keyframe: 150, enter: "zoom" },
  { id: "L06", label: "6 · Ein Swipe", component: C.SwipeLine, beats: 6, keyframe: 50, exit: "50% 56%", exitScale: 9 },
  { id: "L07", label: "7 · Swipe in der App", component: C.Swipe, beats: 13, keyframe: 92, enter: "zoom" },
  { id: "L08", label: "8 · Deal-Ablauf", component: C.DealFlow, beats: 22, keyframe: 240, exit: "62% 72%", exitScale: 6 },
  { id: "L09", label: "9 · Ausgezahlt", component: C.Paid, beats: 7, keyframe: 80, enter: "zoom" },
  { id: "L10", label: "10 · Und für Marken", component: B.ForBrands, beats: 7, keyframe: 100 },
  { id: "L11", label: "11 · Briefing", component: B.Briefing, beats: 27, keyframe: 250 },
  { id: "L12", label: "12 · Creator entdecken", component: B.Discover, beats: 14, keyframe: 200 },
  { id: "L13", label: "13 · Abgrenzung", component: B.Difference, beats: 11, keyframe: 150 },
  { id: "L14", label: "14 · Logo", component: B.EndCard, beats: 8, keyframe: 90 },
  { id: "L15", label: "15 · CTA", component: B.Cta, beats: 13, keyframe: 215 },
];

// Each scene with its start beat, its start frame and its length in frames (to the next start, plus the overlap).
export const LAUNCH_SCENES = SCENES.map((scene, i) => {
  const beat = SCENES.slice(0, i).reduce((n, s) => n + s.beats, 0);
  const start = Math.round(beat * FRAMES_PER_BEAT);
  const next = Math.round((beat + scene.beats) * FRAMES_PER_BEAT);
  const last = i === SCENES.length - 1;
  return { ...scene, beat, start, duration: next - start + (last ? END_HOLD : OVERLAP) };
});

export type TimedScene = (typeof LAUNCH_SCENES)[number];

export const LAUNCH_DURATION = LAUNCH_SCENES[LAUNCH_SCENES.length - 1].start + LAUNCH_SCENES[LAUNCH_SCENES.length - 1].duration;
export const LAUNCH_BEATS = SCENES.reduce((n, s) => n + s.beats, 0);
