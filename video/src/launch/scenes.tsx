import { BRAND_SCENES } from "./scenes-brand";
import { CREATOR_SCENES } from "./scenes-creator";

// The launch video's scenes in order (LAUNCH.md), cut after the reference: nothing ever stands still. The scenes
// themselves are in scenes-creator.tsx and scenes-brand.tsx; this file only orders and times them.

export const LAUNCH_BPM = 90;
export const FRAMES_PER_BEAT = (30 * 60) / LAUNCH_BPM;
export const OVERLAP = 10;
// The last scene holds this long after its last beat.
const END_HOLD = 24;

// How a scene hands over to the next, so the camera seems to keep moving through one take: `dive` zooms into a point
// (CSS transform-origin) and the next scene comes up out of its own `focus`; `pan` slides the camera on, the next scene
// arriving from the opposite side, both with motion blur.
export type Exit = { dive: string; scale?: number } | { pan: "left" | "up" };

export type LaunchScene = {
  id: string;
  label: string;
  component: React.FC;
  // Length in beats (halves allowed), up to the next scene's start.
  beats: number;
  keyframe: number;
  exit?: Exit;
  // Where this scene comes up from after the previous one dived (default the middle).
  focus?: string;
  // How much faster than drawn the cut plays it (the vertical cut tightens its scenes).
  speed?: number;
  // The part of the music that starts with this scene (scripts/make-audio.py, make_launch_bed).
  section?: "turn" | "swipeLine" | "swipe" | "brands" | "brief" | "logo" | "cta";
};

const C = CREATOR_SCENES;
const B = BRAND_SCENES;

const SCENES: LaunchScene[] = [
  { id: "L01", label: "1 · Kaltakquise und Geld", component: C.Opening, beats: 14, keyframe: 120, exit: { dive: "66% 50%" } },
  { id: "L02", label: "2 · Wendung", component: C.Turn, beats: 5, keyframe: 50, exit: { pan: "up" }, section: "turn" },
  { id: "L03", label: "3 · Reveal comtor", component: C.Reveal, beats: 6, keyframe: 105, exit: { dive: "52% 50%", scale: 6 } },
  { id: "L04", label: "4 · Claim und Produkt", component: C.ClaimProduct, beats: 10, keyframe: 190, exit: { dive: "37% 57%", scale: 5 } },
  { id: "L05", label: "5 · Matching", component: C.Matching, beats: 8, keyframe: 150, focus: "25% 49%", exit: { pan: "left" } },
  { id: "L06", label: "6 · Ein Swipe", component: C.SwipeLine, beats: 5, keyframe: 50, exit: { dive: "50% 56%", scale: 9 }, section: "swipeLine" },
  { id: "L07", label: "7 · Swipe in der App", component: C.Swipe, beats: 9.5, keyframe: 92, focus: "54% 62%", exit: { pan: "left" }, section: "swipe" },
  { id: "L08", label: "8 · Deal-Ablauf", component: C.DealFlow, beats: 15, keyframe: 220, exit: { dive: "62% 72%", scale: 6 } },
  { id: "L09", label: "9 · Ausgezahlt", component: C.Paid, beats: 4.5, keyframe: 70, focus: "50% 62%", exit: { pan: "up" } },
  { id: "L10", label: "10 · Und für Marken", component: B.ForBrands, beats: 5, keyframe: 85, exit: { dive: "50% 56%", scale: 6 }, section: "brands" },
  { id: "L11", label: "11 · Briefing", component: B.Briefing, beats: 20.5, keyframe: 240, exit: { pan: "left" }, section: "brief" },
  { id: "L12", label: "12 · Creator entdecken", component: B.Discover, beats: 9.5, keyframe: 170, exit: { pan: "up" } },
  { id: "L13", label: "13 · Abgrenzung", component: B.Difference, beats: 9, keyframe: 150, exit: { dive: "33% 56%", scale: 7 } },
  { id: "L14", label: "14 · Logo", component: B.EndCard, beats: 6, keyframe: 90, exit: { pan: "up" }, section: "logo" },
  { id: "L15", label: "15 · CTA", component: B.Cta, beats: 10, keyframe: 205, section: "cta" },
];

// The 9:16 cut (Reels, TikTok, Shorts), 45 seconds: the creator's way from the cold outreach to the payout, then
// Discover for brands and the call to action, each scene a little faster than drawn. The scenes lay themselves out for
// the tall frame (useStage in kit.tsx). Beats x speed covers what each scene draws up to its hand-over; the music's
// sections start on whole beats.
const VERTICAL: LaunchScene[] = [
  { id: "V01", label: "1 · Kaltakquise und Geld", component: C.Opening, beats: 10, speed: 1.4, keyframe: 120, exit: { dive: "80% 50%" } },
  { id: "V02", label: "2 · Wendung", component: C.Turn, beats: 4, speed: 1.25, keyframe: 50, exit: { pan: "up" }, section: "turn" },
  { id: "V03", label: "3 · Reveal comtor", component: C.Reveal, beats: 5, speed: 1.2, keyframe: 105, exit: { dive: "52% 50%", scale: 6 } },
  { id: "V04", label: "4 · Swipe in der App", component: C.Swipe, beats: 8, speed: 1.19, keyframe: 92, focus: "50% 55%", exit: { pan: "left" }, section: "swipe" },
  { id: "V05", label: "5 · Deal-Ablauf", component: C.DealFlow, beats: 12, speed: 1.25, keyframe: 220, exit: { dive: "26% 80%", scale: 6 } },
  { id: "V06", label: "6 · Ausgezahlt", component: C.Paid, beats: 4, speed: 1.125, keyframe: 70, focus: "50% 56%", exit: { pan: "up" } },
  { id: "V07", label: "7 · Und für Marken", component: B.ForBrands, beats: 4, speed: 1.25, keyframe: 85, exit: { dive: "50% 56%", scale: 6 }, section: "brands" },
  { id: "V08", label: "8 · Creator entdecken", component: B.Discover, beats: 8, speed: 1.19, keyframe: 170, exit: { pan: "up" }, section: "brief" },
  { id: "V09", label: "9 · Logo", component: B.EndCard, beats: 5, speed: 1.2, keyframe: 90, exit: { pan: "up" }, section: "logo" },
  { id: "V10", label: "10 · CTA", component: B.Cta, beats: 7, speed: 1.4, keyframe: 205, section: "cta" },
];

// Each scene with its start beat, its start frame and its length in frames (to the next start, plus the overlap).
function timeline(scenes: LaunchScene[]) {
  return scenes.map((scene, i) => {
    const beat = scenes.slice(0, i).reduce((n, s) => n + s.beats, 0);
    const start = Math.round(beat * FRAMES_PER_BEAT);
    const next = Math.round((beat + scene.beats) * FRAMES_PER_BEAT);
    const last = i === scenes.length - 1;
    // How the previous scene handed over, which decides how this one comes in.
    const came = i > 0 ? scenes[i - 1].exit : undefined;
    return { ...scene, beat, start, came, duration: next - start + (last ? END_HOLD : OVERLAP) };
  });
}

export type TimedScene = ReturnType<typeof timeline>[number];

function duration(scenes: TimedScene[]) {
  const end = scenes[scenes.length - 1];
  return end.start + end.duration;
}

export const LAUNCH_SCENES = timeline(SCENES);
export const LAUNCH_DURATION = duration(LAUNCH_SCENES);
export const VERTICAL_SCENES = timeline(VERTICAL);
export const VERTICAL_DURATION = duration(VERTICAL_SCENES);
